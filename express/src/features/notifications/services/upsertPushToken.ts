// Shared utilities
import { prisma } from '@src/shared/lib/prisma';

// ---------------------------------------------------------------------------
// upsertPushToken
//
// Create or update a push notification token in the database. If a userId is
// supplied the token is linked to that user so that push notifications can be
// routed to the correct device. This is an idempotent operation — calling it
// multiple times with the same token value will update rather than duplicate.
// ---------------------------------------------------------------------------

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
