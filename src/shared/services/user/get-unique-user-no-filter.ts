import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
};
export async function getUniqueUserNoFilter({ where }: Props) {
  return await prisma.user.findUnique({
    where,
  });
}
