/**
 * @file findManyAnnouncements.ts
 * @description Service for retrieving multiple announcements with filters and pagination.
 *
 * @module features/announcements/services
 */

import { prisma } from '@lib/prisma';
import { AnnouncementStatus, AnnouncementPriority, Prisma } from '@prisma/client';

import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

/**
 * Props for finding announcements with filters and pagination.
 *
 * @interface FindManyAnnouncementsProps
 */
export interface FindManyAnnouncementsProps {
  /** The association to scope results to. */
  associationId: string;

  /** Optional filters by status, priority, and search term. */
  filters?: {
    /** Filter by publication status. */
    status?: AnnouncementStatus;

    /** Filter by priority level. */
    priority?: AnnouncementPriority;

    /** Search term for title or summary. Matches only published announcements. */
    search?: string;
  };

  /** Pagination options. */
  pagination?: {
    /** The page number to retrieve. Defaults to 1. */
    page?: number;
  };
}

/**
 * Find announcements for an association with optional filtering and pagination.
 *
 * Returns announcements ordered by pinned status, then published date, then creation date.
 * Includes author details, associated image file, and read receipt metrics.
 *
 * @param {FindManyAnnouncementsProps} props - The search and pagination properties.
 * @returns {Promise<{ announcements: any[], pagination: any }>} List of announcements and pagination metadata.
 */
export async function findManyAnnouncements({
  associationId,
  filters,
  pagination = { page: 1 },
}: FindManyAnnouncementsProps) {
  const { page = 1 } = pagination;
  const limit = PAGE_SIZE;
  const skip = (page - 1) * limit;

  // 1. Build the Prisma where clause from the provided filters
  const where: Prisma.AnnouncementWhereInput = {
    associationId,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.priority && { priority: filters.priority }),
    ...(filters?.search && {
      publishedAt: { not: null },
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  // 2. Data Retrieval: Fetch matching records and total count in parallel
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
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
        readReceipts: true,
        _count: {
          select: {
            readReceipts: true,
          },
        },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  // 3. Response: Return announcements and calculated pagination metadata
  return {
    announcements,
    pagination: buildPagination(total, page, limit),
  };
}
