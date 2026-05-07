import { prisma } from "@src/shared/lib/prisma";
import type { AssociationDetails } from "@src/shared/api/with-association";
import type { CreatePlanInput, UpdatePlanInput } from "../validators/subscription";

export async function createPlan(
  association: AssociationDetails,
  data: CreatePlanInput,
) {
  const existingPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      associationId: association.id,
      isActive: true,
    },
  });

  if (existingPlan) {
    const plan = await prisma.subscriptionPlan.update({
      where: { id: existingPlan.id },
      data: {
        amount: data.amount,
        description: data.description,
        billingCycle: data.billingCycle,
      },
    });
    return { plan, isUpdated: true };
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      associationId: association.id,
      name: "Membership",
      amount: data.amount,
      description: data.description,
      billingCycle: data.billingCycle,
      features: {},
    },
  });

  return { plan, isUpdated: false };
}

export async function updatePlan(
  association: AssociationDetails,
  planId: string,
  data: UpdatePlanInput,
) {
  const existingPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: planId,
      associationId: association.id,
    },
  });

  if (!existingPlan) {
    return null;
  }

  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      amount: data.amount,
      description: data.description,
      billingCycle: data.billingCycle,
    },
  });

  return plan;
}