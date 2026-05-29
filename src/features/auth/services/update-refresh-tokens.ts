import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';

type Props = {
  where: Prisma.RefreshTokenWhereUniqueInput;
  data: Prisma.RefreshTokenUpdateInput;
};

export async function updateRefreshTokens(props: Props) {
  return await prisma.refreshToken.updateMany(props);
}
