import { prisma } from "@src/shared/lib/prisma";
import type { AssociationDetails } from "@src/shared/api/with-association";

export async function getMembers(associationId: string) {
  const members = await prisma.user.findMany({
    where: { associationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      membershipNumber: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return members;
}

export async function getMembersByAssociation(association: AssociationDetails) {
  return getMembers(association.id);
}

export async function getMemberCount(associationId: string) {
  const total = await prisma.user.count({
    where: { associationId },
  });

  const active = await prisma.user.count({
    where: { associationId, status: "ACTIVE" },
  });

  return { total, active };
}