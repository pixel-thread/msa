import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereUniqueInput;
};

/** Finds a user by its unique identifier without applying any visibility filter. */
export async function getUniqueUserNoFilter({ where }: Props) {
  return await prisma.user.findUnique({
    where,
  });
}
