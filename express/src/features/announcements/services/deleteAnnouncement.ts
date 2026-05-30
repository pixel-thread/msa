/**
 * @file deleteAnnouncement.ts
 * @description Service for deleting an announcement.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';

import { NotFoundError, ForbiddenError } from '@src/shared/errors';

/**
 * Props for deleting an announcement.
 *
 * @interface DeleteAnnouncementProps
 */
export interface DeleteAnnouncementProps {
  /** The unique ID of the announcement to delete. */
  announcementId: string;

  /** The ID of the association the announcement belongs to. */
  associationId: string;

  /** The ID of the user requesting the deletion (must be the author). */
  authorId: string;
}

/**
 * Delete an announcement.
 *
 * This service ensures the announcement exists within the scoped association
 * and that only the original author is permitted to perform the deletion.
 *
 * @param {DeleteAnnouncementProps} props - The deletion properties.
 * @returns {Promise<{ success: boolean }>} Confirmation of successful deletion.
 * @throws {NotFoundError} If the announcement is not found.
 * @throws {ForbiddenError} If the requester is not the original author.
 */
export async function deleteAnnouncement({
  announcementId,
  associationId,
  authorId,
}: DeleteAnnouncementProps) {
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

  // 2. Authorization: Only the original author may delete the announcement
  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only delete your own announcements');
  }

  // 3. Persistence: Perform hard delete
  await prisma.announcement.delete({
    where: {
      id: announcementId,
    },
  });

  return { success: true };
}
