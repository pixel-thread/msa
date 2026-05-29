import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.RefreshTokenWhereInput;
};

export async function deleteRefreshTokens(props: Props) {
  return await prisma.refreshToken.deleteMany(props);
}
