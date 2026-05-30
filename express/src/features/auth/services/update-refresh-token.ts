import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for updating a single refresh token. */
type Props = {
  /** The unique identifier of the token to update. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** The data to update. */
  data: Prisma.RefreshTokenUpdateInput;
};

// ---- Service ----

/** Update a single refresh token — primarily used to mark tokens as revoked during token rotation. */
export async function updateRefreshToken(props: Props) {
  return await prisma.refreshToken.update(props);
}
