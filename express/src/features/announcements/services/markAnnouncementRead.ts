/**
 * @file markAnnouncementRead.ts
 * @description Service for marking an announcement as read by a user.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';

/**
 * Props for marking an announcement as read.
 *
 * @interface MarkAnnouncementReadProps
 */
export interface MarkAnnouncementReadProps {
  /** The unique ID of the announcement. */
  announcementId: string;

  /** The ID of the user reading the announcement. */
  userId: string;

  /** The ID of the association scoping the lookup. */
  associationId: string;
}

/**
 * Mark an announcement as read by a user.
 *
 * This service confirms the announcement exists within the association scope
 * and then upserts a read receipt record — creating it if it's the first read,
 * or updating the timestamp if the user is rereading.
 *
 * @param {MarkAnnouncementReadProps} props - The mark-read properties.
 * @returns {Promise<any>} The created or updated read receipt record.
 * @throws {NotFoundError} If the announcement is not found.
 */
export async function markAnnouncementRead({
  announcementId,
  userId,
  associationId,
}: MarkAnnouncementReadProps) {
  // 1. Verification: Confirm the announcement exists within the association
  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
      associationId,
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // 2. Persistence: Upsert the read receipt
  // (create if first read, otherwise update the readAt timestamp)
  const readReceipt = await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId,
      },
    },
    create: {
      announcementId,
      userId,
    },
    update: {
      readAt: new Date(),
    },
  });

  return readReceipt;
}
