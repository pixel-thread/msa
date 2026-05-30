// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { prisma } from '@src/shared/lib/prisma';

// ---------------------------------------------------------------------------
// Types — Props
// ---------------------------------------------------------------------------

/** Arguments for the findUniqueMember query. */
type Props = {
  where: Prisma.UserWhereUniqueInput;
};

// ---------------------------------------------------------------------------
// Service — Find a unique member by ID and return selected fields
// Business intent: used by suspend/delete handlers to verify the target
//   member exists and belongs to the caller's association before mutating.
// ---------------------------------------------------------------------------
export async function findUniqueMember({ where }: Props) {
  return await prisma.user.findUnique({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      associationId: true,
    },
  });
}
