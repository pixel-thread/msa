import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';

/** Props for updating multiple refresh tokens. */
type Props = {
  /** The filter to select which tokens to update. */
  where: Prisma.RefreshTokenWhereUniqueInput;
  /** The data to update. */
  data: Prisma.RefreshTokenUpdateInput;
};

/** Update multiple refresh tokens matching the given criteria. */
export async function updateRefreshTokens(props: Props) {
  return await prisma.refreshToken.updateMany(props);
}
