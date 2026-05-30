import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for creating a refresh token. */
type Props = {
  /** The data to create the refresh token with. */
  data: Prisma.RefreshTokenCreateInput;
};

/** Create a new refresh token in the database. */
export async function createRefreshToken(props: Props) {
  return await prisma.refreshToken.create(props);
}
