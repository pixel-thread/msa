import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';

import { NotFoundError } from '@src/shared/errors';

import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for creating an announcement. */
interface CreateAnnouncementProps {
  /** The association this announcement belongs to. */
  associationId: string;
  /** The user creating the announcement. */
  authorId: string;
  /** The announcement content data. */
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
  /** Whether to send push notifications upon publishing. */
  sendNotification?: boolean;
}

// ---------------------------------------------------------------------------
// Create announcement
// ---------------------------------------------------------------------------

/**
 * Create a new announcement.
 * Optionally sends push notifications if the announcement is published.
 */
export async function createAnnouncement({
  associationId,
  authorId,
  data,
  sendNotification = false,
}: CreateAnnouncementProps) {
  // Verify the author exists within the association
  const author = await prisma.user.findFirst({
    where: { id: authorId, associationId },
  });

  if (!author) {
    throw new NotFoundError('Author not found');
  }

  // Persist the announcement record
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

  // Fire push notifications if the announcement was published immediately
  if (sendNotification && announcement.status === AnnouncementStatus.PUBLISHED) {
    await sendAnnouncementNotifications(announcement.id, associationId);
  }

  return announcement;
}
