import { prisma } from '@lib/prisma';

import { NotFoundError, ForbiddenError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for deleting an announcement. */
interface DeleteAnnouncementProps {
  /** The announcement to delete. */
  announcementId: string;
  /** The association the announcement belongs to. */
  associationId: string;
  /** The user requesting the deletion. */
  authorId: string;
}

// ---------------------------------------------------------------------------
// Delete announcement
// ---------------------------------------------------------------------------

/**
 * Delete an announcement.
 * Only the original author can delete their own announcements.
 */
export async function deleteAnnouncement({
  announcementId,
  associationId,
  authorId,
}: DeleteAnnouncementProps) {
  // Ensure the announcement exists within the association scope
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // Only the original author may delete the announcement
  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only delete your own announcements');
  }

  // Perform hard delete
  await prisma.announcement.delete({
    where: { id: announcementId },
  });

  return { success: true };
}
