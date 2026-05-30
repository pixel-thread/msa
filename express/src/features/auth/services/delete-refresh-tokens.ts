import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for deleting refresh tokens. */
type Props = {
  /** The filter to select which tokens to delete. */
  where: Prisma.RefreshTokenWhereInput;
};

/** Delete refresh tokens matching the given criteria. */
export async function deleteRefreshTokens(props: Props) {
  return await prisma.refreshToken.deleteMany(props);
}
