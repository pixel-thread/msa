/**
 * @file upload-image.route.ts
 * @description Route handler for uploading an image for an announcement.
 *
 * @module features/announcements/routes
 */

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// Shared utilities
import { success } from '@src/shared/utils/responses';
import { validate } from '@src/shared/lib/validate';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

// Prisma
import { UserRole } from '@prisma/client';

// Storage
import { deleteFromBucket } from '@src/shared/lib/supabase/storage';

// Validators
import { AnnouncementRouteParams } from '@src/features/announcements/validators';

/**
 * POST /api/announcements/:announcementId/upload
 * Upload an image for an announcement.
 * Security: SECRETARY role or higher required.
 *
 * @type {RequestHandler[]}
 */
export const postUploadImage: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const announcementId = req.params.announcementId;

    logger.info(
      { traceId, announcementId },
      'POST /api/announcements/[id]/upload - Request started',
    );

    // Enforce SECRETARY role — only secretaries and above may upload images
    const user = await withRole(req, UserRole.SECRETARY);

    logger.info(
      { traceId, userId: user.id, announcementId },
      'POST /api/announcements/[id]/upload - User authorized',
    );

    logger.info(
      { traceId, announcementId },
      'POST /api/announcements/[id]/upload - Uploading image',
    );

    // TODO: wire up actual uploadAnnouncementImage service call
    const announcement = {} as any;
    const oldStorageKey = undefined as string | undefined;

    // Clean up the previous image from storage if one existed
    if (oldStorageKey) {
      try {
        await deleteFromBucket(oldStorageKey);
      } catch (error) {
        logger.error(
          { error, traceId },
          'POST /api/announcements/[id]/upload - Failed to delete old image',
        );
      }
    }

    logger.info(
      { traceId, announcementId },
      'POST /api/announcements/[id]/upload - Success',
    );

    return success(res, { data: announcement }, 200);
  }),
];
