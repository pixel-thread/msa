/**
 * @file createAnnouncement.ts
 * @description Service for creating a new announcement.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';

import { NotFoundError } from '@src/shared/errors';

import { sendAnnouncementNotifications } from './sendAnnouncementNotifications';

/**
 * Props for creating an announcement.
 *
 * @interface CreateAnnouncementProps
 */
export interface CreateAnnouncementProps {
  /** The association this announcement belongs to. */
  associationId: string;

  /** The user creating the announcement. */
  authorId: string;

  /** The announcement content data. */
  data: {
    /** The title of the announcement. */
    title: string;

    /** A brief summary of the announcement. */
    summary?: string;

    /** The full content of the announcement. */
    content: string;

    /** Optional URL for an announcement image. */
    imageUrl?: string;

    /** The publication status of the announcement. Defaults to DRAFT. */
    status?: AnnouncementStatus;

    /** The priority level of the announcement. Defaults to NORMAL. */
    priority?: AnnouncementPriority;

    /** Optional list of roles allowed to view the announcement. */
    targetRoles?: UserRole[];

    /** Whether the announcement should be pinned to the top. */
    isPinned?: boolean;

    /** The date and time when the announcement should be published. */
    publishedAt?: Date;

    /** The date and time when the announcement should expire. */
    expiresAt?: Date;
  };

  /** Whether to send push notifications upon publishing. */
  sendNotification?: boolean;
}

/**
 * Create a new announcement.
 *
 * This service verifies the author's existence within the association,
 * persists the announcement record to the database, and optionally
 * triggers push notifications if the announcement is published.
 *
 * @param {CreateAnnouncementProps} props - The creation properties.
 * @returns {Promise<any>} The created announcement with author details.
 * @throws {NotFoundError} If the author is not found.
 */
export async function createAnnouncement({
  associationId,
  authorId,
  data,
  sendNotification = false,
}: CreateAnnouncementProps) {
  // 1. Validation: Verify the author exists within the association
  const author = await prisma.user.findFirst({
    where: {
      id: authorId,
      associationId,
    },
  });

  if (!author) {
    throw new NotFoundError('Author not found');
  }

  // 2. Persistence: Create the announcement record
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
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // 3. Side Effects: Fire push notifications if published immediately
  if (sendNotification && announcement.status === AnnouncementStatus.PUBLISHED) {
    await sendAnnouncementNotifications(announcement.id, associationId);
  }

  return announcement;
}
