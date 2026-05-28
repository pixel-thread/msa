import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { CreateSubscriptionPlanSchema } from "@feature/subscriptions/validators";
import { BadRequestError, ValidationError } from "@src/shared/errors";
import { hasHighRoleAccess, getTraceId } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (association, _, request) => {
  const traceId = getTraceId(request);
  const user = await withRole(request, UserRole.MEMBER);
  if (hasHighRoleAccess(user.role)) {
    logger.info("Fetching all plans for admin", { traceId });
    const plans = await prisma.subscriptionPlan.findMany({
      where: { associationId: association.id },
      include: {
        versions: {
          where: { effectiveTo: null },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const plansWithActiveVersion = plans.map((plan) => ({
      ...plan,
      activeVersion: plan.versions[0] || null,
      versions: plan.versions,
    }));

    logger.info("Admin plans fetched successfully", {
      traceId,
      count: plans.length,
    });

    return SuccessResponse({ data: plansWithActiveVersion });
  }

  logger.info("Fetching plans for member", {
    traceId,
    memberTypeId: user.memberTypeId,
  });

  const whereClause: Record<string, unknown> = {
    associationId: association.id,
    isActive: true,
  };

  if (user.memberTypeId) {
    whereClause.memberTypeId = user.memberTypeId;
  } else {
    whereClause.memberTypeId = null;
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: whereClause,
    include: {
      versions: {
        take: 1,
        orderBy: { amount: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (plans.length === 0) {
    logger.info(
      "No member-specific plans found, falling back to default plan",
      { traceId },
    );

    const defaultPlan = await prisma.subscriptionPlan.findMany({
      where: {
        associationId: association.id,
        isDefault: true,
        isActive: true,
      },
      include: {
        versions: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const plansWithActiveVersion = defaultPlan.map((plan) => ({
      ...plan,
      activeVersion: plan.versions[0] || null,
      versions: undefined,
    }));

    logger.info("Returning default plan", {
      traceId,
      planId: defaultPlan[0]?.id,
    });

    return SuccessResponse({ data: plansWithActiveVersion[0] || null });
  }

  const plansWithActiveVersion = plans.map((plan) => ({
    ...plan,
    activeVersion: plan.versions[0] || null,
    versions: undefined,
  }));

  const sortedPlans = user.memberTypeId
    ? plansWithActiveVersion.sort(
        (a, b) =>
          Number(a.activeVersion?.amount ?? 0) -
          Number(b.activeVersion?.amount ?? 0),
      )
    : plansWithActiveVersion;

  const result = user.memberTypeId ? sortedPlans[0] : sortedPlans[0] || null;

  logger.info("Member plans fetched successfully", { traceId });

  return SuccessResponse({ data: result });
});

export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    const traceId = getTraceId(request);
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    logger.info("Checking plan name uniqueness", { traceId, name: body.name });

    const isPlanExistWithSameName = await prisma.subscriptionPlan.findFirst({
      where: {
        name: body.name,
        associationId: association.id,
      },
    });

    if (isPlanExistWithSameName)
      throw new BadRequestError("Plan with same name already exist");

    logger.info("Unsetting default on existing plans", { traceId });

    logger.info("Creating new plan as default", { traceId, name: body.name });

    const plan = await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlan.updateMany({
        where: { associationId: association.id },
        data: { isDefault: false },
      });

      return tx.subscriptionPlan.create({
        data: {
          name: body.name,
          description: body.description,
          isActive: body.isActive,
          isDefault: true,
          memberTypeId: body.memberTypeId,
          associationId: association.id,
          versions: {
            create: {
              amount: body.amount,
              currency: body.currency,
              billingCycle: body.billingCycle,
              features: body.features,
              effectiveFrom: body.effectiveFrom,
              effectiveTo: body.effectiveTo,
              description: body.description,
            },
          },
        },
        include: {
          versions: {
            where: { effectiveTo: null },
            take: 1,
          },
        },
      });
    });

    logger.info("Plan created successfully", { traceId, planId: plan.id });

    return SuccessResponse({ data: plan }, 201);
  },
);
