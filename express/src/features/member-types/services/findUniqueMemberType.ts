// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { prisma } from '@lib/prisma';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** Parameters for finding a unique member type. */
interface FindUniqueMemberTypeProps {
  associationId: string;
  memberTypeId: string;
}

// ---------------------------------------------------------------------------
// Find unique member type
//
// Looks up a member type scoped to the given association. Returns the count
// of linked users and subscription plans alongside the record so callers can
// decide whether deletion is safe.
// ---------------------------------------------------------------------------

/**
 * Find a single member type by ID within a specific association.
 *
 * WHY: member types are association-scoped; a direct Prisma findUnique by
 * id alone could return a record from a different association.
 */
export async function findUniqueMemberType({
  associationId,
  memberTypeId,
}: FindUniqueMemberTypeProps) {
  return await prisma.memberType.findFirst({
    where: { id: memberTypeId, associationId },
    include: {
      _count: {
        select: { users: true, subscriptionPlans: true },
      },
    },
  });
}
