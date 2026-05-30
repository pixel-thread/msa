import { prisma } from '@lib/prisma';
import { NotFoundError, ForbiddenError } from '@src/shared/errors';

/** Props for deleting an announcement. */
interface DeleteAnnouncementProps {
  /** The announcement to delete. */
  announcementId: string;
  /** The association the announcement belongs to. */
  associationId: string;
  /** The user requesting the deletion. */
  authorId: string;
}

/** Delete an announcement. Only the original author can delete their own announcements. */
export async function deleteAnnouncement({
  announcementId,
  associationId,
  authorId,
}: DeleteAnnouncementProps) {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  if (announcement.authorId !== authorId) {
    throw new ForbiddenError('You can only delete your own announcements');
  }

  await prisma.announcement.delete({
    where: { id: announcementId },
  });

  return { success: true };
}
