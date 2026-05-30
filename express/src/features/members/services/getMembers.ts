import { prisma } from '@src/shared/lib/prisma';
import type { AssociationDetails } from '@src/shared/api';
import { Prisma } from '@prisma/client';
import { buildPagination } from '@src/shared/utils/build-pagination';

/** Arguments for the getMembers query. */
type Props = {
  where: Prisma.UserWhereInput;
  page?: number;
  search?: string;
};

/** Get a paginated list of members with optional search filtering. */
export async function getMembers({ where, page = 1, search }: Props) {
  const pageSize = search ? 20 : 10;

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { membershipNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  const skip = (page - 1) * pageSize;

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,

      skip,

      take: pageSize,

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        associationId: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: members,

    pagination: buildPagination(total, page, pageSize),
  };
}

/** Get all members for a given association. */
export async function getMembersByAssociation(association: AssociationDetails) {
  return getMembers({ where: { associationId: association.id } });
}

/** Get the total and active member counts for an association. */
export async function getMemberCount(associationId: string) {
  const total = await prisma.user.count({
    where: { associationId },
  });

  const active = await prisma.user.count({
    where: { associationId, status: 'ACTIVE' },
  });

  return { total, active };
}
