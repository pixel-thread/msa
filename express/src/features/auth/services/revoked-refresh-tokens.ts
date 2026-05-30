import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib';

/** Props for revoking refresh tokens. */
type Props = {
  /** The filter to select which tokens to revoke. */
  where: Prisma.RefreshTokenWhereInput;
};

/** Revoke (mark as revoked) all refresh tokens matching the given criteria. */
export async function revokedRefreshTokens({ where }: Props) {
  return await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}
