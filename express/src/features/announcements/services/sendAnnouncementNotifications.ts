import 'server-only';
import { prisma } from '@lib/prisma';
import { NotificationType, Prisma } from '@prisma/client';
import { ExpoNotificationService } from '@lib/expo';
import { logger } from '@src/shared/logger/server';
import { EXPO_ROUTES } from '@src/shared/constants/expo-route';
import { createNotification } from '@src/shared/services/notification';

export async function sendAnnouncementNotifications(announcementId: string, associationId: string) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) return;

    const whereClause: Prisma.UserWhereInput = {
      associationId,
      status: 'ACTIVE',
    };

    if (announcement.targetRoles && announcement.targetRoles.length > 0) {
      whereClause.role = { hasSome: announcement.targetRoles };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true },
    });

    if (users.length === 0) return;

    const notificationPromises = users.map(async (user) => {
      const pushTokens = await prisma.pushToken.findMany({
        where: { userId: user.id },
        select: { token: true },
      });

      if (pushTokens.length === 0) return;

      const notification = await createNotification({
        data: {
          userId: user.id,
          title: announcement.title,
          type: NotificationType.SYSTEM,
          body: announcement.summary ?? 'New announcement posted',
          route: EXPO_ROUTES.ANNOUNCEMENTS.DETAIL(announcement.id),
          entityId: announcement.id,
          imageUrl: announcement.imageUrl,
          meta: { priority: announcement.priority },
          associationId,
        },
      });

      await ExpoNotificationService.sendPushNotifications(
        pushTokens.map((t) => t.token),
        announcement.title,
        announcement.summary ?? 'New announcement posted',
        {
          id: notification.id,
          title: announcement.title,
          body: announcement.summary ?? 'New announcement posted',
          type: 'GENERAL_MESSAGE',
          entityId: announcement.id,
          route: EXPO_ROUTES.ANNOUNCEMENTS.DETAIL(announcement.id),
        },
      );
    });

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    logger.error({ error }, 'Failed to send announcement notifications:');
  }
}
