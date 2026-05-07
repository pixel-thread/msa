import { prisma } from "@src/shared/lib/prisma";
import type { AssociationDetails } from "@src/shared/api/with-association";

export async function getPlan(associationId: string) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      associationId,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return plan;
}

export async function getPlanByAssociation(association: AssociationDetails) {
  return getPlan(association.id);
}