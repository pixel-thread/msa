import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for marking an announcement as read. */
interface MarkAnnouncementReadProps {
  /** The announcement to mark as read. */
  announcementId: string;
  /** The user reading the announcement. */
  userId: string;
  /** The association scoping the lookup. */
  associationId: string;
}

// ---------------------------------------------------------------------------
// Mark announcement as read
// ---------------------------------------------------------------------------

/**
 * Mark an announcement as read by a user.
 * Creates a new read receipt or updates the read timestamp of an existing one.
 */
export async function markAnnouncementRead({
  announcementId,
  userId,
  associationId,
}: MarkAnnouncementReadProps) {
  // Confirm the announcement exists within the association
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId, associationId },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  // Upsert the read receipt — create if first read, otherwise update the timestamp
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
