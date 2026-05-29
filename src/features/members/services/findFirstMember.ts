import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereInput;
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
};

export async function findFirstMember({ where, select, include }: Props) {
  const args: Prisma.UserFindFirstArgs = { where };
  if (select) args.select = select;
  if (include) args.include = include;
  return await prisma.user.findFirst(args);
}
