import { prisma } from "@src/shared/lib/prisma";
import type { AssociationDetails } from "@src/shared/api/with-association";

export async function getAllPayments(association: AssociationDetails) {
  const payments = await prisma.payment.findMany({
    where: {
      associationId: association.id,
      type: "SUBSCRIPTION",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          membershipNumber: true,
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  const totalCollected = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalMembers = await prisma.user.count({
    where: { associationId: association.id },
  });

  const paidMembers = await prisma.payment.groupBy({
    by: ["userId"],
    where: {
      associationId: association.id,
      type: "SUBSCRIPTION",
      status: "COMPLETED",
    },
  });

  return {
    payments,
    summary: {
      totalCollected,
      totalMembers,
      paidMembers: paidMembers.length,
      pendingMembers: totalMembers - paidMembers.length,
    },
  };
}