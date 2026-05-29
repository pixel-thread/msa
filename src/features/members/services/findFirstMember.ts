import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereInput;
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
};

export async function findFirstMember({ where, select, include }: Props) {
  return await prisma.user.findFirst({ where, select, include });
}
