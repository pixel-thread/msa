import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { CreateSubscriptionPlanSchema } from "@feature/subscriptions/validators";
import { ValidationError } from "@src/shared/errors";

export const GET = withAssociation({}, async (association, _, request) => {
  await withRole(request, UserRole.MEMBER);

  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      associationId: association.id,
      isActive: true,
    },
    orderBy: {
      amount: "asc",
    },
  });

  return SuccessResponse({ data: plans });
});

export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.PRESIDENT);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        ...body,
        features: body.features,
        associationId: association.id,
      },
    });

    return SuccessResponse({ data: plan }, 201);
  },
);
