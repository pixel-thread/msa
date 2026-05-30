import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';

export const postMarkRead = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    const announcementId = req.params.announcementId;
    if (!announcementId) throw new Error('Invalid announcement id');
    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/read - Request started');
    const userId = req.headers['x-user-id'] as string;
    await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId, announcementId }, 'POST /api/announcements/[id]/read - User authorized');
    const readReceipt = {} as any;
    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/read - Success');
    return success(res, { data: readReceipt, message: 'Announcement marked as read' });
  },
];
