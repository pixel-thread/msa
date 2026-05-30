import { Prisma } from '@prisma/client';
import { prisma } from '@lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
};

/** Finds a unique user by its identifier, returning only safe/public fields. */
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
