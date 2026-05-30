/**
 * @file updateAnnouncement.ts
 * @description Service for updating an existing announcement.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';

import { NotFoundError, ForbiddenError } from '@src/shared/errors';

import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

/**
 * Props for updating an announcement.
 *
 * @interface UpdateAnnouncementProps
 */
export interface UpdateAnnouncementProps {
  /** The unique ID of the announcement to update. */
  announcementId: string;

  /** The ID of the association scoping the update. */
  associationId: string;

  /** The ID of the user requesting the update (must be the author). */
  authorId: string;

  /** The fields to update. */
  data: {
    /** The updated title of the announcement. */
    title?: string;

    /** The updated summary of the announcement. */
    summary?: string;

    /** The updated full content of the announcement. */
    content?: string;

    /** The updated image URL, or null to remove it. */
    imageUrl?: string | null;

    /** The updated publication status. */
    status?: AnnouncementStatus;

    /** The updated priority level. */
    priority?: AnnouncementPriority;

    /** The updated list of allowed roles. */
    targetRoles?: UserRole[];

    /** Whether the announcement should be pinned. */
    isPinned?: boolean;

    /** The updated publication date. */
    publishedAt?: Date | null;

    /** The updated expiration date. */
    expiresAt?: Date | null;
  };
}

/**
 * Update an announcement.
 *
 * This service ensures the announcement exists and that the requester is the original author.
 * It applies partial updates to the record and triggers push notifications if the
 * announcement is transitioning from DRAFT to PUBLISHED.
 *
 * @param {UpdateAnnouncementProps} props - The update properties.
 * @returns {Promise<any>} The updated announcement record with author details.
 * @throws {NotFoundError} If the announcement is not found.
 * @throws {ForbiddenError} If the requester is not the original author.
 */
export async function updateAnnouncement({
  announcementId,
  associationId,
  authorId,
  data,
}: UpdateAnnouncementProps) {
  // 1. Verification: Ensure the announcement exists within the association scope
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      associationId,
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // 2. Authorization: Only the original author may edit the announcement
  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only update your own announcements');
  }

  // 3. Logic: Detect draft-to-published transition for notification dispatch
  const wasDraft = announcement.status === AnnouncementStatus.DRAFT;
  const isPublishing = data.status === AnnouncementStatus.PUBLISHED && wasDraft;

  // 4. Persistence: Apply partial updates
  const updated = await prisma.announcement.update({
    where: {
      id: announcementId,
    },
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
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // 5. Side Effects: Send notifications if this is a fresh publish
  if (isPublishing) {
    await sendAnnouncementNotifications(updated.id, associationId);
  }

  return updated;
}
