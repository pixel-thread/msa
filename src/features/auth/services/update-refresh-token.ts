import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { Prisma } from '@prisma/client';
type Props = {
  where: Prisma.RefreshTokenWhereUniqueInput;
  data: Prisma.RefreshTokenUpdateInput;
};

export async function updateRefreshToken(props: Props) {
  return await prisma.refreshToken.update(props);
}
