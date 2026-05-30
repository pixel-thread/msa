import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for deleting refresh tokens. */
type Props = {
  /** The filter to select which tokens to delete. */
  where: Prisma.RefreshTokenWhereInput;
};

// ---- Service ----

/** Remove all refresh tokens matching the given criteria — used when a password change or reset invalidates all existing sessions. */
export async function deleteRefreshTokens(props: Props) {
  return await prisma.refreshToken.deleteMany(props);
}
