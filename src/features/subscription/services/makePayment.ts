import { prisma } from "@src/shared/lib/prisma";

export async function makePayment(userId: string, planId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.association) {
    throw new Error("User or association not found");
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: planId,
      associationId: user.association.id,
      isActive: true,
    },
  });

  if (!plan) {
    throw new Error("No membership plan available");
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      type: "SUBSCRIPTION",
      status: "COMPLETED",
    },
    orderBy: { paymentDate: "desc" },
  });

  if (existingPayment) {
    return {
      status: "already_paid",
      payment: existingPayment,
    };
  }

  const receiptNumber = `RCP-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)
    .toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      associationId: user.association.id,
      userId: user.id,
      amount: plan.amount,
      currency: plan.currency,
      type: "SUBSCRIPTION",
      status: "COMPLETED",
      receiptNumber,
      notes: `Membership payment for ${
        plan.billingCycle === "ONE_TIME" ? "one-time" : "yearly"
      } membership`,
      paymentDate: new Date(),
    },
  });

  return {
    status: "paid",
    payment,
  };
}