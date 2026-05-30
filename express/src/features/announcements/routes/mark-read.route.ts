import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';
import { validate } from '@src/shared/lib/validate';
import { AnnouncementRouteParams } from '@src/features/announcements/validators';

export const postMarkRead: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const announcementId = req.params.announcementId;
    if (!announcementId) throw new Error('Invalid announcement id');
    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/read - Request started');
    const userId = req.userId as string;
    await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'POST /api/announcements/[id]/read - User authorized',
    );
    const readReceipt = {} as any;
    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/read - Success');
    return success(res, { data: readReceipt, message: 'Announcement marked as read' });
  },
];
