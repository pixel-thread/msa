// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Association, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { prisma } from '@src/shared/lib/prisma';
import { buildPagination } from '@src/shared/utils/build-pagination';

// ---------------------------------------------------------------------------
// Types — Props
// ---------------------------------------------------------------------------

/** Arguments for the getMembers query. */
type Props = {
  where: Prisma.UserWhereInput;
  page?: number;
  search?: string;
};

// ---------------------------------------------------------------------------
// Service — Get a paginated list of members with optional search filtering
// Business intent: centralised read path for the member directory that
//   applies consistent pagination defaults and search-over-OR logic so
//   callers do not replicate this pattern.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Service — Get all members for a given association
// Business intent: thin convenience wrapper used when every member of an
//   association is needed without search or pagination.
// ---------------------------------------------------------------------------
export async function getMembersByAssociation(association: Association) {
  return getMembers({ where: { associationId: association.id } });
}

// ---------------------------------------------------------------------------
// Service — Get the total and active member counts for an association
// Business intent: used on dashboard widgets to display membership
//   health without transferring full records.
// ---------------------------------------------------------------------------
export async function getMemberCount(associationId: string) {
  const total = await prisma.user.count({
    where: { associationId },
  });

  const active = await prisma.user.count({
    where: { associationId, status: 'ACTIVE' },
  });

  return { total, active };
}
