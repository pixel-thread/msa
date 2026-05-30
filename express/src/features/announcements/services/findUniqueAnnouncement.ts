/**
 * @file findUniqueAnnouncement.ts
 * @description Service for retrieving a single announcement by ID.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';

import { NotFoundError } from '@src/shared/errors';

/**
 * Props for fetching a unique announcement.
 *
 * @interface FindUniqueAnnouncementProps
 */
export interface FindUniqueAnnouncementProps {
  /** The unique ID of the announcement. */
  announcementId: string;

  /** The ID of the association to scope the lookup. */
  associationId: string;
}

/**
 * Find a single announcement by ID within an association.
 *
 * This service retrieves an announcement record along with author details,
 * associated image file, recent read receipts, and a total read-receipt count.
 *
 * @param {FindUniqueAnnouncementProps} props - The lookup properties.
 * @returns {Promise<any>} The announcement record with included relations.
 * @throws {NotFoundError} If the announcement does not exist within the association scope.
 */
export async function findUniqueAnnouncement({
  announcementId,
  associationId,
}: FindUniqueAnnouncementProps) {
  const announcement = await prisma.announcement.findUnique({
    where: {
      id: announcementId,
      associationId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
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
        orderBy: {
          readAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              membershipNumber: true,
            },
          },
        },
      },
      _count: {
        select: {
          readReceipts: true,
        },
      },
    },
  });

  if (!announcement) {
    throw new NotFoundError('Announcement');
  }

  return announcement;
}
