import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for updating multiple refresh tokens. */
type Props = {
  /** The filter to select which tokens to update. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** The data to update. */
  data: Prisma.RefreshTokenUpdateInput;
};

// ---- Service ----

/** Bulk-update refresh tokens matching the given criteria — used during logout to revoke all matching tokens. */
export async function updateRefreshTokens(props: Props) {
  return await prisma.refreshToken.updateMany(props);
}
