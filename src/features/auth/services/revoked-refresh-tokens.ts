import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib';

type Props = {
  where: Prisma.RefreshTokenWhereInput;
};
export async function revokedRefreshTokens({ where }: Props) {
  return await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}
