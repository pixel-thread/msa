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
import { UserRole } from '@prisma/client';

// Services
import { getAssociation } from '@src/shared/services/association/get-association';

// Validators
import {
  AnnouncementRouteParams,
  UpdateAnnouncementSchema,
  PublishAnnouncementSchema,
} from '@src/features/announcements/validators';

// ---------------------------------------------------------------------------
// GET /api/announcements/:announcementId
// Fetch a single announcement by ID.
// Security: MEMBER role required.
// ---------------------------------------------------------------------------

export const getAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const association = await getAssociation(req);

    const announcementId = req.params.announcementId;

    if (!announcementId) throw new ForbiddenError('Invalid announcement id');

    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - Request started');

    await withRole(req, UserRole.MEMBER);

    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - User authorized');

    // TODO: wire up actual findUniqueAnnouncement service call
    const announcement = {} as any;

    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - Success');

    return success(res, { data: announcement, message: 'Successfully fetch announcement' });
  }),
];

// ---------------------------------------------------------------------------
// PUT /api/announcements/:announcementId
// Update an announcement.
// Security: MEMBER role required, but only high-role users may proceed.
// ---------------------------------------------------------------------------

export const putAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams, body: UpdateAnnouncementSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const association = await getAssociation(req);

    logger.info({ traceId }, 'PUT /api/announcements/[id] - Request started');

    if (!req.body) throw new ForbiddenError('Invalid request body');

    const announcementId = req.params.announcementId;

    if (!announcementId) throw new ForbiddenError('Invalid announcement id');

    const userId = req.userId as string;

    // Enforce MEMBER role as base gate
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId, announcementId },
      'PUT /api/announcements/[id] - User authorized',
    );

    // Only high-role users (secretaries, admins) may update announcements
    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can update announcements');
    }

    logger.info(
      { traceId, announcementId },
      'PUT /api/announcements/[id] - Updating announcement',
    );

    // TODO: wire up actual updateAnnouncement service call
    const announcement = {} as any;

    logger.info({ traceId, announcementId }, 'PUT /api/announcements/[id] - Success');

    return success(res, { data: announcement });
  }),
];

// ---------------------------------------------------------------------------
// DELETE /api/announcements/:announcementId
// Remove an announcement.
// Security: MEMBER role required, but only high-role users may proceed.
// ---------------------------------------------------------------------------

export const deleteAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const association = await getAssociation(req);

    const announcementId = req.params.announcementId;

    if (!announcementId) throw new ForbiddenError('Invalid announcement id');

    logger.info({ traceId, announcementId }, 'DELETE /api/announcements/[id] - Request started');

    const userId = req.userId as string;

    // Enforce MEMBER role as base gate
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId, announcementId },
      'DELETE /api/announcements/[id] - User authorized',
    );

    // Only high-role users may delete announcements
    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can delete announcements');
    }

    logger.info(
      { traceId, announcementId },
      'DELETE /api/announcements/[id] - Deleting announcement',
    );

    // TODO: wire up actual deleteAnnouncement service call

    logger.info({ traceId, announcementId }, 'DELETE /api/announcements/[id] - Success');

    return success(res, { data: { success: true } });
  }),
];

// ---------------------------------------------------------------------------
// PATCH /api/announcements/:announcementId
// Publish, archive, or unpublish an announcement.
// Security: MEMBER role required, but only high-role users may proceed.
// ---------------------------------------------------------------------------

export const patchAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams, body: PublishAnnouncementSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const association = await getAssociation(req);

    const announcementId = req.params.announcementId;

    if (!announcementId) throw new ForbiddenError('Invalid announcement id');

    logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Request started');

    const userId = req.userId as string;

    // Enforce MEMBER role as base gate
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId, announcementId },
      'PATCH /api/announcements/[id] - User authorized',
    );

    // Only high-role users may change announcement status
    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can publish/archive announcements');
    }

    const action = req.body?.action;

    logger.info(
      { traceId, announcementId, action },
      'PATCH /api/announcements/[id] - Processing action',
    );

    // Dispatch based on the requested action
    if (action === 'publish') {
      // TODO: wire up actual publish service call
      const announcement = {} as any;

      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Published');

      return success(res, { data: announcement });
    }

    if (action === 'archive') {
      // TODO: wire up actual archive service call
      const announcement = {} as any;

      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Archived');

      return success(res, { data: announcement });
    }

    if (action === 'unpublish') {
      // TODO: wire up actual unpublish service call
      const announcement = {} as any;

      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Unpublished');

      return success(res, { data: announcement });
    }

    throw new ForbiddenError('Invalid action. Use: publish, archive, or unpublish');
  }),
];
