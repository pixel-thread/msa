import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

/** Props for marking an announcement as read. */
interface MarkAnnouncementReadProps {
  /** The announcement to mark as read. */
  announcementId: string;
  /** The user reading the announcement. */
  userId: string;
  /** The association scoping the lookup. */
  associationId: string;
}

/** Mark an announcement as read by a user. Creates or updates a read receipt. */
export async function markAnnouncementRead({
  announcementId,
  userId,
  associationId,
}: MarkAnnouncementReadProps) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

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
