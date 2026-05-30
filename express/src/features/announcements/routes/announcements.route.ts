import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';

export const getAnnouncements: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId, query: req.query }, 'GET /api/announcements - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/announcements - User authorized',
    );
    const query = req.query as any;
    if (!query) throw new ForbiddenError('Invalid query parameters');

    if (hasHighRoleAccess(user.role)) {
      const result = {} as any;

      logger.info(
        { traceId, count: result.announcements?.length },
        'GET /api/announcements - Success',
      );
      return success(res, { data: result.announcements, meta: result.pagination });
    }
    const result = {} as any;
    logger.info(
      { traceId, count: result.announcements?.length },
      'GET /api/announcements - Success',
    );
    return success(res, { data: result.announcements, meta: result.pagination });
  },
];

export const postAnnouncement: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId }, 'POST /api/announcements - Request started');
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/announcements - User authorized',
    );
    if (!req.body) throw new ForbiddenError('Invalid request body');
    const userId = req.userId as string;
    const isPublishing = req.body.status === AnnouncementStatus.PUBLISHED;
    logger.info(
      {
        traceId,
        associationId: association.id,
        title: req.body.title,
        status: req.body.status,
        isPublishing,
      },
      'POST /api/announcements - Creating announcement',
    );
    const announcement = {} as any;
    logger.info({ traceId, announcementId: announcement.id }, 'POST /api/announcements - Success');
    return success(res, { data: announcement }, 201);
  },
];
