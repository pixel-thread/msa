import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Arguments for the findUniqueMember query. */
type Props = {
  where: Prisma.UserWhereUniqueInput;
};

/** Find a unique member by their ID and return selected fields. */
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
