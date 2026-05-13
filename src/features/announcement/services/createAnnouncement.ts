import { prisma } from "@lib/prisma";
import {
  AnnouncementStatus,
  AnnouncementPriority,
  UserRole,
  NotificationType,
} from "@prisma/client";
import { NotFoundError } from "@src/shared/errors";
import { ExpoNotificationService } from "@lib/expo";
import { logger } from "@src/shared/logger";
import { ExpoRoutes } from "@src/shared/constants/expo-route";
import { createNotification } from "@src/shared/services/notification";

interface CreateAnnouncementProps {
  associationId: string;
  authorId: string;
  data: {
    title: string;
    summary?: string;
    content: string;
    imageUrl?: string;
    status?: AnnouncementStatus;
    priority?: AnnouncementPriority;
    targetRoles?: UserRole[];
    isPinned?: boolean;
    publishedAt?: Date;
    expiresAt?: Date;
  };
  sendNotification?: boolean;
}

export async function createAnnouncement({
  associationId,
  authorId,
  data,
  sendNotification = false,
}: CreateAnnouncementProps) {
  const author = await prisma.user.findFirst({
    where: { id: authorId, associationId },
  });

  if (!author) {
    throw new NotFoundError("Author not found");
  }

  const announcement = await prisma.announcement.create({
    data: {
      associationId,
      authorId,
      title: data.title,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl,
      status: data.status ?? AnnouncementStatus.DRAFT,
      priority: data.priority ?? AnnouncementPriority.NORMAL,
      targetRoles: data.targetRoles ?? [],
      isPinned: data.isPinned ?? false,
      publishedAt: data.publishedAt,
      expiresAt: data.expiresAt,
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (sendNotification && announcement.status === AnnouncementStatus.PUBLISHED) {
    await sendAnnouncementNotifications(announcement.id, associationId);
  }

  return announcement;
}

async function sendAnnouncementNotifications(
  announcementId: string,
  associationId: string
) {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) return;

    let users;
    if (announcement.targetRoles && announcement.targetRoles.length > 0) {
      users = await prisma.user.findMany({
        where: {
          associationId,
          role: { hasSome: announcement.targetRoles },
          status: "ACTIVE",
        },
        select: { id: true, name: true },
      });
    } else {
      users = await prisma.user.findMany({
        where: {
          associationId,
          status: "ACTIVE",
        },
        select: { id: true, name: true },
      });
    }

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
          body: announcement.summary ?? "New announcement posted",
          route: ExpoRoutes.ANNOUNCEMENTS.DETAIL(announcement.id),
          entityId: announcement.id,
          imageUrl: announcement.imageUrl,
          meta: { priority: announcement.priority },
          associationId,
        },
      });

      await ExpoNotificationService.sendPushNotifications(
        pushTokens.map((t) => t.token),
        announcement.title,
        announcement.summary ?? "New announcement posted",
        {
          id: notification.id,
          type: "ANNOUNCEMENT",
          entityId: announcement.id,
          route: ExpoRoutes.ANNOUNCEMENTS.DETAIL(announcement.id),
        }
      );
    });

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    logger.error("Failed to send announcement notifications:", { error });
  }
}