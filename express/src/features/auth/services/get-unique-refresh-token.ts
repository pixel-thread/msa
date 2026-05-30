import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for fetching a unique refresh token. */
type Props = {
  /** The unique identifier to look up. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** Relations to include in the result. */
  include: Prisma.RefreshTokenInclude;
};

/** Find a unique refresh token by its identifier. */
export async function getUniqueRefreshToken(props: Props) {
  return await prisma.refreshToken.findUnique(props);
}
