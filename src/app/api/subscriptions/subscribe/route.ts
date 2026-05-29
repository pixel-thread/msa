import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { SubscribeSchema } from "@feature/subscriptions/validators";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@src/shared/errors";
import { logger } from "@src/shared/logger/server";

export const POST = withAssociation(
  { body: SubscribeSchema },
  async (association, { body, traceId }, request) => {
    logger.info({
      traceId,
      associationId: association.id,
    }, "POST /api/subscriptions/subscribe - Request started");

    const user = await withRole(request, UserRole.MEMBER);

    logger.info({
      traceId,
      userId: user.id,
    }, "POST /api/subscriptions/subscribe - User authorized");

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: body.planId,
        associationId: association.id,
        isActive: true,
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
    });

    if (!plan || plan.versions.length === 0) {
      throw new NotFoundError("Plan not found or has no active version");
    }

    const activeVersion = plan.versions[0];

    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existing && existing.status === "ACTIVE") {
      throw new ConflictError("User already has an active subscription");
    }

    const startDate = new Date();
    const endDate = new Date();
    if (activeVersion.billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
        planVersionId: activeVersion.id,
        status: "ACTIVE",
        startDate,
        endDate,
        waivedAt: null,
        waivedReason: null,
        waivedBy: null,
      },
      create: {
        userId: user.id,
        planId: plan.id,
        planVersionId: activeVersion.id,
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    await prisma.subscriptionBillingHistory.create({
      data: {
        subscriptionId: subscription.id,
        planVersionId: activeVersion.id,
        amountCharged: activeVersion.amount,
        status: "PENDING",
        periodStart: startDate,
        periodEnd: endDate,
        dueDate: startDate,
      },
    });

    logger.info({
      traceId,
      subscriptionId: subscription.id,
    }, "POST /api/subscriptions/subscribe - Success");

    return SuccessResponse({ data: subscription }, 201);
  },
);
