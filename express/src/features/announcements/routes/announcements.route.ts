import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { findManyAnnouncements } from '../services';
import { validate } from '@src/shared/lib/validate';
import {
  CreateAnnouncementSchema,
  AnnouncementQuerySchema,
} from '@src/features/announcements/validators';

/** GET handler to list announcements with optional filters and pagination. */
export const getAnnouncements: RequestHandler[] = [
  validate({ query: AnnouncementQuerySchema }),
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
      const result = await findManyAnnouncements({
        associationId: user.associationId,
        filters: {
          status: 'PUBLISHED',
          priority: query.priority,
          search: query.search,
        },
        pagination: {
          page: query.page,
        },
      });

      logger.info(
        {
          traceId,
          total: result.pagination.total,
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
        },
        'GET /api/announcements - Success',
      );
      return success(res, { data: result.announcements, meta: result.pagination });
    }

    const result = await findManyAnnouncements({
      associationId: user.associationId,
      filters: {
        status: 'PUBLISHED',
        priority: query.priority,
        search: query.search,
      },
    });

    logger.info(
      { traceId, count: result.announcements?.length },
      'GET /api/announcements - Success',
    );
    return success(res, { data: result.announcements, meta: result.pagination });
  },
];

/** POST handler to create a new announcement. Requires SECRETARY role or higher. */
export const postAnnouncement: RequestHandler[] = [
  validate({ body: CreateAnnouncementSchema }),
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
