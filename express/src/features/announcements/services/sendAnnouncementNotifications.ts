/**
 * @file sendAnnouncementNotifications.ts
 * @description Service for dispatching push notifications for published announcements.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';
import { NotificationType, Prisma } from '@prisma/client';

import { ExpoNotificationService } from '@lib/expo';
import { EXPO_ROUTES } from '@src/shared/constants/expo-route';
import { createNotification } from '@src/shared/services/notification';
import { logger } from '@src/shared/logger';

/**
 * Send push notifications for a published announcement to all eligible users.
 *
 * This service identifies target users based on the announcement's association
 * and optional target roles. It then creates notification records in the database
 * and dispatches push notifications via the Expo service.
 *
 * @param {string} announcementId - The ID of the announcement to notify about.
 * @param {string} associationId - The ID of the association scoping the users.
 * @returns {Promise<void>}
 */
export async function sendAnnouncementNotifications(
  announcementId: string,
  associationId: string,
) {
  try {
    // 1. Retrieval: Fetch the announcement details
    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
      },
    });

    if (!announcement) {
      return;
    }

    // 2. Identification: Build user filter and fetch target users
    const whereClause: Prisma.UserWhereInput = {
      associationId,
      status: 'ACTIVE',
    };

    if (announcement.targetRoles && announcement.targetRoles.length > 0) {
      whereClause.role = {
        hasSome: announcement.targetRoles,
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
    });

    if (users.length === 0) {
      return;
    }

    // 3. Dispatch: Create notification records and send push notifications
    const notificationPromises = users.map(async (user) => {
      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId: user.id,
        },
        select: {
          token: true,
        },
      });

      if (pushTokens.length === 0) {
        return;
      }

      // Persist the notification in the database
      const notification = await createNotification({
        data: {
          userId: user.id,
          title: announcement.title,
          type: NotificationType.SYSTEM,
          body: announcement.summary ?? 'New announcement posted',
          route: EXPO_ROUTES.ANNOUNCEMENTS.DETAIL(announcement.id),
          entityId: announcement.id,
          imageUrl: announcement.imageUrl,
          meta: {
            priority: announcement.priority,
          },
          associationId,
        },
      });

      // Dispatch push notification via Expo
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

    // Fire all notifications concurrently, tolerating individual failures
    await Promise.allSettled(notificationPromises);
  } catch (error) {
    logger.error({ error }, 'Failed to send announcement notifications');
  }
}
