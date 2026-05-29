import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';

export async function findAssociationAdmins(associationId: string) {
  return await prisma.user.findMany({
    where: {
      associationId,
      role: {
        hasSome: [UserRole.DPO, UserRole.PRESIDENT, UserRole.SUPER_ADMIN],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });
}
