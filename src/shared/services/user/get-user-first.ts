import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.UserWhereInput;
};

export async function getUserFirst(props: Props) {
  return await prisma.user.findFirst(props);
}
