import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUpdateInput;
};

export async function updateMember({ data, where }: Props) {
  return await prisma.user.update({ where, data });
}
