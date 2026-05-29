import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

interface MarkAnnouncementReadProps {
  announcementId: string;
  userId: string;
  associationId: string;
}

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
