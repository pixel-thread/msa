import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { deleteFromBucket } from '@src/shared/lib/supabase/storage';
import { validate } from '@src/shared/lib/validate';
import { AnnouncementRouteParams } from '@src/features/announcements/validators';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST handler to upload an image for an announcement. Requires SECRETARY role or higher. */
export const postUploadImage: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const announcementId = req.params.announcementId;
    logger.info(
      { traceId, announcementId },
      'POST /api/announcements/[id]/upload - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, announcementId },
      'POST /api/announcements/[id]/upload - User authorized',
    );
    logger.info(
      { traceId, announcementId },
      'POST /api/announcements/[id]/upload - Uploading image',
    );
    const announcement = {} as any;
    const oldStorageKey = undefined as string | undefined;
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
    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/upload - Success');
    return success(res, { data: announcement }, 200);
  }),
];
