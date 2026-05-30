/**
 * @file announcements.route.ts
 * @description Route handlers for the announcements collection.
 * Provides endpoints for listing and creating announcements.
 *
 * @module features/announcements/routes
 */

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// Shared utilities
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { validate } from '@src/shared/lib/validate';
import { withRole } from '@src/shared/utils/with-role';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

// Prisma
import { UserRole, AnnouncementStatus } from '@prisma/client';

// Services
import { getAssociation } from '@src/shared/services/association/get-association';
import { findManyAnnouncements } from '../services';

// Validators
import {
  CreateAnnouncementSchema,
  AnnouncementQuerySchema,
} from '@src/features/announcements/validators';

/**
 * GET /api/announcements
 * List announcements with optional filters and pagination.
 * Security: MEMBER role required. High-role users receive pagination metadata.
 *
 * @type {RequestHandler[]}
 */
export const getAnnouncements: RequestHandler[] = [
  validate({ query: AnnouncementQuerySchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info({ traceId, query: req.query }, 'GET /api/announcements - Request started');

    // Enforce MEMBER role — any authenticated member can view announcements
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/announcements - User authorized',
    );

    const query = req.query as any;

    // Reject requests with invalid query parameters
    if (!query) {
      throw new ForbiddenError('Invalid query parameters');
    }

    // High-role users (secretaries, admins) get full pagination support
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

      return success(res, {
        data: result.announcements,
        meta: result.pagination,
      });
    }

    // Regular members — no pagination, just the default page
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

    return success(res, {
      data: result.announcements,
      meta: result.pagination,
    });
  }),
];

/**
 * POST /api/announcements
 * Create a new announcement.
 * Security: SECRETARY role or higher required.
 *
 * @type {RequestHandler[]}
 */
export const postAnnouncement: RequestHandler[] = [
  validate({ body: CreateAnnouncementSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve the association from the request context
    const association = await getAssociation(req);

    logger.info({ traceId }, 'POST /api/announcements - Request started');

    // Enforce SECRETARY role — only secretaries and above may create announcements
    const user = await withRole(req, UserRole.SECRETARY);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/announcements - User authorized',
    );

    // Guard against empty request body
    if (!req.body) {
      throw new ForbiddenError('Invalid request body');
    }

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

    // TODO: wire up actual createAnnouncement service call
    const announcement = {} as any;

    logger.info({ traceId, announcementId: announcement.id }, 'POST /api/announcements - Success');

    return success(res, { data: announcement }, 201);
  }),
];
