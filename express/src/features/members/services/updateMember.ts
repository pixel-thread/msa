import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Arguments for the updateMember query. */
type Props = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUpdateInput;
};

/** Update a member's data in the database. */
export async function updateMember({ data, where }: Props) {
  return await prisma.user.update({ where, data });
}
