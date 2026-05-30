import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib';

// ---- Types ----

/** Props for revoking refresh tokens. */
type Props = {
  /** The filter to select which tokens to revoke. */
  where: Prisma.RefreshTokenWhereInput;
};

// ---- Service ----

/** Mark all refresh tokens matching the filter as revoked — used as a security measure when token reuse is detected to invalidate the entire token family. */
export async function revokedRefreshTokens({ where }: Props) {
  return await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}
