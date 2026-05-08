import { prisma } from "@src/shared/lib/prisma";

export async function getMySubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.association) {
    throw new Error("User not found");
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      associationId: user.association.id,
      isActive: true,
    },
  });

  if (!plan) {
    return {
      hasPaid: false,
      plan: null,
      message: "No membership plan configured",
    };
  }

  const payment = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      type: "SUBSCRIPTION",
      status: "COMPLETED",
    },
    orderBy: { paymentDate: "desc" },
  });

  return {
    hasPaid: !!payment,
    plan: {
      id: plan.id,
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      description: plan.description,
    },
    lastPayment: payment
      ? {
          id: payment.id,
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
        }
      : null,
  };
}