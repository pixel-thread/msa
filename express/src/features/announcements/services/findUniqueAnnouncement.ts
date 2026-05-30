import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for fetching a unique announcement. */
interface FindUniqueAnnouncementProps {
  /** The announcement ID. */
  announcementId: string;
  /** The association to scope the lookup. */
  associationId: string;
}

// ---------------------------------------------------------------------------
// Find unique announcement
// ---------------------------------------------------------------------------

/**
 * Find a single announcement by ID within an association.
 * Includes author, image file, read receipts, and read-receipt count.
 * Throws NotFoundError if the announcement does not exist.
 */
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
