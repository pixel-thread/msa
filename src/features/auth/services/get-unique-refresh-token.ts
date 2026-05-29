import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.RefreshTokenWhereUniqueInput;
  include: Prisma.RefreshTokenInclude;
};

export async function getUniqueRefreshToken(props: Props) {
  return await prisma.refreshToken.findUnique(props);
}
