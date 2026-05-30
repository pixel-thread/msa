import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError } from '@src/shared/errors';

interface FindUniqueAnnouncementProps {
  announcementId: string;
  associationId: string;
}

export async function findUniqueAnnouncement({
  announcementId,
  associationId,
}: FindUniqueAnnouncementProps) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId, associationId },
    include: {
      author: {
        select: { id: true, name: true, imageUrl: true },
      },
      imageFile: {
        select: {
          id: true,
          url: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          thumbnailUrl: true,
        },
      },
      readReceipts: {
        take: 10,
        orderBy: { readAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, membershipNumber: true },
          },
        },
      },
      _count: {
        select: { readReceipts: true },
      },
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  return announcement;
}
