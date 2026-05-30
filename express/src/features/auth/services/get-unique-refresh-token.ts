import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for fetching a unique refresh token. */
type Props = {
  /** The unique identifier to look up. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** Relations to include in the result. */
  include: Prisma.RefreshTokenInclude;
};

// ---- Service ----

/** Retrieve a single refresh token by its unique identifier, including related user data for token rotation validation. */
export async function getUniqueRefreshToken(props: Props) {
  return await prisma.refreshToken.findUnique(props);
}
