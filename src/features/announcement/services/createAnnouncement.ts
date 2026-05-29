import 'server-only';
import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';
import { NotFoundError } from '@src/shared/errors';
import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

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
    throw new NotFoundError('Author not found');
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
