import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError, ForbiddenError } from '@src/shared/errors';

interface DeleteAnnouncementProps {
  announcementId: string;
  associationId: string;
  authorId: string;
}

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
