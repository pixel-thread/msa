import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { CreateSubscriptionPlanSchema } from "@feature/subscriptions/validators";
import { BadRequestError, ValidationError } from "@src/shared/errors";
import { hasHighRoleAccess } from "@src/shared/utils";

export const GET = withAssociation({}, async (association, _, request) => {
  const user = await withRole(request, UserRole.MEMBER);

  if (hasHighRoleAccess(user.role)) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { associationId: association.id },
      include: {
        versions: {
          where: { effectiveTo: { lte: new Date().toISOString() } },
          take: 1,
          orderBy: { amount: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return SuccessResponse({ data: plans });
  }

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
        where: { effectiveTo: null },
        take: 1,
        orderBy: { amount: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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

  const result = user.memberTypeId ? sortedPlans : sortedPlans[0] || null;

  return SuccessResponse({ data: result });
});

export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const isPlanExistWithSameName = await prisma.subscriptionPlan.findFirst({
      where: {
        name: body.name,
        associationId: association.id,
      },
    });

    if (isPlanExistWithSameName)
      throw new BadRequestError("Plan with same name already exist");

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        memberTypeId: body.memberTypeId,
        associationId: association.id,
        versions: {
          create: {
            amount: body.amount,
            currency: body.currency,
            billingCycle: body.billingCycle,
            features: body.features,
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

    return SuccessResponse({ data: plan }, 201);
  },
);
