import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { SubscribeSchema } from "@feature/subscriptions/validators";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@src/shared/errors";

export const POST = withAssociation(
  { body: SubscribeSchema },
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.MEMBER);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }
    let plan;
    plan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: body.planId,
        associationId: association.id,
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundError("Plan not found");
    }

    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existing && existing.status === "ACTIVE") {
      throw new ConflictError("User already has an active subscription");
    }

    const startDate = new Date();
    const endDate = new Date();
    if (plan.billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId: plan.id,
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
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    return SuccessResponse({ data: subscription }, 201);
  },
);
