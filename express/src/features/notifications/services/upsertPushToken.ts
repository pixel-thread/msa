import { prisma } from '@src/shared/lib/prisma';

/**
 * Upsert (create or update) a push notification token.
 * If a userId is provided, it will be linked to the token.
 */
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
