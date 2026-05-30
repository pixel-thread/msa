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

/** Arguments for the updateMember query. */
type Props = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUpdateInput;
};

// ---------------------------------------------------------------------------
// Service — Update a member's data in the database
// Business intent: generic upsert wrapper used across all member mutation
//   handlers so that write access goes through a single Prisma gateway.
// ---------------------------------------------------------------------------
export async function updateMember({ data, where }: Props) {
  return await prisma.user.update({ where, data });
}
