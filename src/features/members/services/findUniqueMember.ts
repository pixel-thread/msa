import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
};

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
