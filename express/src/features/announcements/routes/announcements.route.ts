import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';

const CreateAnnouncementSchema = {} as any;
const AnnouncementQuerySchema = {} as any;

export const getAnnouncements = [
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, query: req.query }, 'GET /api/announcements - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id, roles: user.role }, 'GET /api/announcements - User authorized');
    const query = req.query as any;
    if (!query) throw new ForbiddenError('Invalid query parameters');
    const { page, priority, search, status } = query;
    if (hasHighRoleAccess(user.role)) {
      const result = {} as any;
      logger.info({ traceId, count: result.announcements?.length }, 'GET /api/announcements - Success');
      return success(res, { data: result.announcements, meta: result.pagination });
    }
    const result = {} as any;
    logger.info({ traceId, count: result.announcements?.length }, 'GET /api/announcements - Success');
    return success(res, { data: result.announcements, meta: result.pagination });
  },
];

export const postAnnouncement = [
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId }, 'POST /api/announcements - Request started');
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId, userId: user.id, roles: user.role }, 'POST /api/announcements - User authorized');
    if (!req.body) throw new ForbiddenError('Invalid request body');
    const userId = req.headers['x-user-id'] as string;
    const isPublishing = req.body.status === AnnouncementStatus.PUBLISHED;
    logger.info({ traceId, associationId: association.id, title: req.body.title, status: req.body.status, isPublishing }, 'POST /api/announcements - Creating announcement');
    const announcement = {} as any;
    logger.info({ traceId, announcementId: announcement.id }, 'POST /api/announcements - Success');
    return success(res, { data: announcement }, 201);
  },
];
