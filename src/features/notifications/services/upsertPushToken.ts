import 'server-only';
import { prisma } from '@src/shared/lib/prisma';

export async function upsertPushToken(token: string, userId?: string) {
  return await prisma.pushToken.upsert({
    where: { token },
    update: {
      ...(userId ? { userId } : {}),
      updatedAt: new Date(),
    },
    create: {
      token,
      ...(userId ? { userId } : {}),
    },
  });
}
