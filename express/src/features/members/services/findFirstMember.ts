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

/** Arguments for the findFirstMember query. */
type Props = {
  where: Prisma.UserWhereInput;
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
};

// ---------------------------------------------------------------------------
// Service — Find the first member matching the given criteria
// Business intent: used by handlers that need either a subset of fields
//   (via `select`) or related entities (via `include`) without forcing
//   every caller to construct the full Prisma call.
// ---------------------------------------------------------------------------
export async function findFirstMember({ where, select, include }: Props) {
  const args: Prisma.UserFindFirstArgs = { where };
  if (select) args.select = select;
  if (include) args.include = include;
  return await prisma.user.findFirst(args);
}
