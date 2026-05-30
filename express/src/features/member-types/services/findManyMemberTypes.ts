// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { prisma } from '@lib/prisma';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** Parameters for finding member types. */
interface FindManyMemberTypesProps {
  associationId: string;
}

// ---------------------------------------------------------------------------
// Find many member types
//
// Returns all member types for an association sorted by level ascending.
// Includes counts of users and subscription plans for each type.
// ---------------------------------------------------------------------------

/**
 * Retrieve all member types for an association, ordered by level ascending.
 *
 * WHY: The UI renders member types in a hierarchy; ascending level order
 * reflects seniority (junior → senior).
 */
export async function findManyMemberTypes({ associationId }: FindManyMemberTypesProps) {
  return await prisma.memberType.findMany({
    where: { associationId },
    orderBy: { level: 'asc' },
    include: {
      _count: {
        select: { users: true, subscriptionPlans: true },
      },
    },
  });
}
