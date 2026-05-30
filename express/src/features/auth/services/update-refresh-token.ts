import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';

/** Props for updating a single refresh token. */
type Props = {
  /** The unique identifier of the token to update. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** The data to update. */
  data: Prisma.RefreshTokenUpdateInput;
};

/** Update a single refresh token in the database. */
export async function updateRefreshToken(props: Props) {
  return await prisma.refreshToken.update(props);
}
