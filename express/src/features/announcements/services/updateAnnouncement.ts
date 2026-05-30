import 'server-only';
import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '@src/shared/errors';
import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

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
    throw new NotFoundError('Announcement');
  }

  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only update your own announcements');
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
