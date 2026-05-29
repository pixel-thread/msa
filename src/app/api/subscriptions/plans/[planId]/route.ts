import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError, NotFoundError } from "@src/shared/errors";
import { Prisma } from "@prisma/client";
import { logger } from "@src/shared/logger/server";

const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  memberTypeId: z.uuid().optional().nullable(),
});

export const PATCH = withAssociation(
  { body: UpdatePlanSchema },
  async (association, { body, traceId }, request, { params }) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      "PATCH /api/subscriptions/plans/[planId] - Request started",
    );

    const user = await withRole(request, UserRole.SUPER_ADMIN);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      "PATCH /api/subscriptions/plans/[planId] - User authorized",
    );

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const { planId } = (await params) as { planId: string };

    const priceFields = ["amount", "currency", "billingCycle", "features"];
    const hasPriceChange = priceFields.some(
      (field) => body[field as keyof typeof body] !== undefined,
    );

    if (hasPriceChange) {
      const currentVersion = await prisma.subscriptionPlanVersion.findFirst({
        where: { planId, effectiveTo: null },
      });

      if (!currentVersion) {
        throw new NotFoundError("No active version found for this plan");
      }

      const updatedPlan = await prisma.$transaction(async (tx) => {
        await tx.subscriptionPlanVersion.update({
          where: { id: currentVersion.id },
          data: { effectiveTo: new Date() },
        });

        const newVersion = await tx.subscriptionPlanVersion.create({
          data: {
            planId,
            amount: body.amount ?? currentVersion.amount,
            currency: body.currency ?? currentVersion.currency,
            billingCycle: body.billingCycle ?? currentVersion.billingCycle,
            features:
              (body.features as Prisma.InputJsonValue) ??
              currentVersion.features,
            description: body.description ?? currentVersion.description,
          },
        });

        const plan = await tx.subscriptionPlan.update({
          where: { id: planId, associationId: association.id },
          data: {
            name: body.name,
            description: body.description,
            isActive: body.isActive,
            memberTypeId: body.memberTypeId,
          },
        });

        return { ...plan, activeVersion: newVersion };
      });

      logger.info(
        {
          traceId,
          planId,
        },
        "PATCH /api/subscriptions/plans/[planId] - Success",
      );

      return SuccessResponse({ data: updatedPlan });
    }

    const { amount, currency, billingCycle, features, ...metadata } = body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId, associationId: association.id },
      data: metadata,
    });

    logger.info(
      {
        traceId,
        planId,
      },
      "PATCH /api/subscriptions/plans/[planId] - Success",
    );

    return SuccessResponse({ data: plan });
  },
);

export const DELETE = withAssociation(
  {},
  async (association, { traceId }, request, { params }) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      "DELETE /api/subscriptions/plans/[planId] - Request started",
    );

    const user = await withRole(request, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      "DELETE /api/subscriptions/plans/[planId] - User authorized",
    );

    const { planId } = (await params) as { planId: string };

    const plan = await prisma.subscriptionPlan.update({
      where: {
        id: planId,
        associationId: association.id,
      },
      data: {
        isActive: false,
      },
    });

    logger.info(
      {
        traceId,
        planId,
      },
      "DELETE /api/subscriptions/plans/[planId] - Success",
    );

    return SuccessResponse({
      data: plan,
      message: "Plan deleted successfully",
    });
  },
);
