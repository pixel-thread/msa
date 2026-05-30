import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';

import { NotFoundError, ForbiddenError } from '@src/shared/errors';

import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for updating an announcement. */
interface UpdateAnnouncementProps {
  /** The announcement to update. */
  announcementId: string;
  /** The association scoping the update. */
  associationId: string;
  /** The user requesting the update. */
  authorId: string;
  /** The fields to update. */
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

// ---------------------------------------------------------------------------
// Update announcement
// ---------------------------------------------------------------------------

/**
 * Update an announcement.
 * Only the original author can update their own announcements.
 * Sends notifications if the announcement transitions from draft to published.
 */
export async function updateAnnouncement({
  announcementId,
  associationId,
  authorId,
  data,
}: UpdateAnnouncementProps) {
  // Ensure the announcement exists within the association scope
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // Only the original author may edit the announcement
  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only update your own announcements');
  }

  // Detect draft-to-published transition for notification dispatch
  const wasDraft = announcement.status === AnnouncementStatus.DRAFT;
  const isPublishing = data.status === AnnouncementStatus.PUBLISHED && wasDraft;

  // Apply partial updates — only include fields the caller provided
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

  // Send notifications if this is a fresh publish
  if (isPublishing) {
    await sendAnnouncementNotifications(updated.id, associationId);
  }

  return updated;
}
