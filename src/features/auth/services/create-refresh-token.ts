import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  data: Prisma.RefreshTokenCreateInput;
};

export async function createRefreshToken(props: Props) {
  return await prisma.refreshToken.create(props);
}
