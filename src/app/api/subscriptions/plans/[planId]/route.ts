import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";

const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().datetime().optional(),
});

export const PATCH = withAssociation(
  { body: UpdatePlanSchema },
  async (association, { body }, request, { params }) => {
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const { planId } = (await params) as { planId: string };

    const plan = await prisma.subscriptionPlan.update({
      where: {
        id: planId,
        associationId: association.id,
      },
      data: body,
    });

    return SuccessResponse({ data: plan });
  },
);

export const DELETE = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.SUPER_ADMIN);

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

  return SuccessResponse({ data: plan });
});
