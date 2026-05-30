import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Arguments for the findFirstMember query. */
type Props = {
  where: Prisma.UserWhereInput;
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
};

/** Find the first member matching the given criteria. */
export async function findFirstMember({ where, select, include }: Props) {
  const args: Prisma.UserFindFirstArgs = { where };
  if (select) args.select = select;
  if (include) args.include = include;
  return await prisma.user.findFirst(args);
}
