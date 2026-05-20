import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { CreateSubscriptionPlanSchema } from "@feature/subscriptions/validators";
import { ValidationError } from "@src/shared/errors";

export const GET = withAssociation({}, async (association, _, request) => {
  const user = await withRole(request, UserRole.MEMBER);

  let plans;
  if (user.memberTypeId) {
    plans = await prisma.subscriptionPlan.findMany({
      where: {
        associationId: association.id,
        isActive: true,
        memberTypeId: user.memberTypeId,
      },
      orderBy: {
        amount: "asc",
      },
    });
  } else {
    plans = await prisma.subscriptionPlan.findFirst({
      where: {
        associationId: association.id,
        isActive: true,
      },
      orderBy: {
        amount: "asc",
      },
    });
  }

  return SuccessResponse({ data: plans });
});

export const POST = withAssociation(
  { body: CreateSubscriptionPlanSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.SUPER_ADMIN);

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
