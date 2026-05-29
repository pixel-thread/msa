import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
};
export async function getUniqueUser({ where }: Props) {
  return await prisma.user.findUnique({
    where,
    select: {
      id: true,
      associationId: true,
      email: true,
      name: true,
      role: true,
      status: true,
      memberTypeId: true,
      imageUrl: true,
    },
  });
}
