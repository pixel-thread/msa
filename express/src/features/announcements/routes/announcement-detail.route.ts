import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { logger } from '@src/shared/logger';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { validate } from '@src/shared/lib/validate';
import {
  AnnouncementRouteParams,
  UpdateAnnouncementSchema,
  PublishAnnouncementSchema,
} from '@src/features/announcements/validators';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET handler to fetch a single announcement by ID. */
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
    const announcement = {} as any;
    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - Success');
    return success(res, { data: announcement, message: 'Successfully fetch announcement' });
  }),
];

/** PUT handler to update an announcement. Requires high-role access. */
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
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'PUT /api/announcements/[id] - User authorized',
    );
    if (!hasHighRoleAccess(user.role))
      throw new ForbiddenError('Only high role users can update announcements');
    logger.info({ traceId, announcementId }, 'PUT /api/announcements/[id] - Updating announcement');
    const announcement = {} as any;
    logger.info({ traceId, announcementId }, 'PUT /api/announcements/[id] - Success');
    return success(res, { data: announcement });
  }),
];

/** DELETE handler to remove an announcement. Requires high-role access. */
export const deleteAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const announcementId = req.params.announcementId;
    if (!announcementId) throw new ForbiddenError('Invalid announcement id');
    logger.info({ traceId, announcementId }, 'DELETE /api/announcements/[id] - Request started');
    const userId = req.userId as string;
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'DELETE /api/announcements/[id] - User authorized',
    );
    if (!hasHighRoleAccess(user.role))
      throw new ForbiddenError('Only high role users can delete announcements');
    logger.info(
      { traceId, announcementId },
      'DELETE /api/announcements/[id] - Deleting announcement',
    );
    logger.info({ traceId, announcementId }, 'DELETE /api/announcements/[id] - Success');
    return success(res, { data: { success: true } });
  }),
];

/** PATCH handler to publish, archive, or unpublish an announcement. Requires high-role access. */
export const patchAnnouncement: RequestHandler[] = [
  validate({ params: AnnouncementRouteParams, body: PublishAnnouncementSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const announcementId = req.params.announcementId;
    if (!announcementId) throw new ForbiddenError('Invalid announcement id');
    logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Request started');
    const userId = req.userId as string;
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'PATCH /api/announcements/[id] - User authorized',
    );
    if (!hasHighRoleAccess(user.role))
      throw new ForbiddenError('Only high role users can publish/archive announcements');
    const action = req.body?.action;
    logger.info(
      { traceId, announcementId, action },
      'PATCH /api/announcements/[id] - Processing action',
    );
    if (action === 'publish') {
      const announcement = {} as any;
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Published');
      return success(res, { data: announcement });
    }
    if (action === 'archive') {
      const announcement = {} as any;
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Archived');
      return success(res, { data: announcement });
    }
    if (action === 'unpublish') {
      const announcement = {} as any;
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Unpublished');
      return success(res, { data: announcement });
    }
    throw new ForbiddenError('Invalid action. Use: publish, archive, or unpublish');
  }),
];
