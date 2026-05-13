import { prisma } from "@lib/prisma";
import {
  AnnouncementStatus,
  AnnouncementPriority,
  UserRole,
  NotificationType,
} from "@prisma/client";
import { NotFoundError, ForbiddenError } from "@src/shared/errors";
import { ExpoNotificationService } from "@lib/expo";
import { logger } from "@src/shared/logger";
import { ExpoRoutes } from "@src/shared/constants/expo-route";
import { createNotification } from "@src/shared/services/notification";

interface UpdateAnnouncementProps {
  announcementId: string;
  associationId: string;
  authorId: string;
  data: {
    title?: string;
    summary?: string;
    content?: string;
    imageUrl?: string | null;
    status?: AnnouncementStatus;
    priority?: AnnouncementPriority;
    targetRoles?: UserRole[];
    isPinned?: boolean;
    publishedAt?: Date | null;
    expiresAt?: Date | null;
  };
}

export async function updateAnnouncement({
  announcementId,
  associationId,
  authorId,
  data,
}: UpdateAnnouncementProps) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError("Announcement");
  }

  if (announcement.authorId !== authorId) {
    throw new ForbiddenError("You can only update your own announcements");
  }

  const wasDraft = announcement.status === AnnouncementStatus.DRAFT;
  const isPublishing = data.status === AnnouncementStatus.PUBLISHED && wasDraft;

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles }),
      ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (isPublishing) {
    await sendAnnouncementNotifications(updated.id, associationId);
  }

  return updated;
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