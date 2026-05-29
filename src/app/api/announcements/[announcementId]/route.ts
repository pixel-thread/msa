import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import {
  updateAnnouncement,
  deleteAnnouncement,
  findUniqueAnnouncement,
} from '@feature/announcement/services';
import { UpdateAnnouncementSchema } from '@feature/announcement/validators';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { NextRequest } from 'next/server';
import z from 'zod';

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const GET = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, announcementId: params?.announcementId },
      'GET /api/announcements/[id] - Request started',
    );

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError('Invalid announcement id');
    }

    await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - User authorized');

    const announcement = await findUniqueAnnouncement({
      announcementId,
      associationId: association.id,
    });

    logger.info({ traceId, announcementId }, 'GET /api/announcements/[id] - Success');

    return SuccessResponse({
      data: announcement,
      message: 'Successfully fetch announcement',
    });
  },
);

export const PUT = withAssociation(
  { body: UpdateAnnouncementSchema, params: RouteParams },
  async (association, { body, params, traceId }, request: NextRequest) => {
    logger.info({ traceId }, 'PUT /api/announcements/[id] - Request started');

    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError('Invalid announcement id');
    }

    const userId = request.headers.get('x-user-id')!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'PUT /api/announcements/[id] - User authorized',
    );

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can update announcements');
    }

    logger.info({ traceId, announcementId }, 'PUT /api/announcements/[id] - Updating announcement');

    const announcement = await updateAnnouncement({
      announcementId,
      associationId: association.id,
      authorId: userId,
      data: {
        ...body,
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : body.publishedAt === null
            ? null
            : undefined,
        expiresAt: body.expiresAt
          ? new Date(body.expiresAt)
          : body.expiresAt === null
            ? null
            : undefined,
      },
    });

    logger.info({ traceId, announcementId }, 'PUT /api/announcements/[id] - Success');

    return SuccessResponse({ data: announcement });
  },
);

export const DELETE = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request: NextRequest) => {
    logger.info(
      { traceId, announcementId: params?.announcementId },
      'DELETE /api/announcements/[id] - Request started',
    );

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError('Invalid announcement id');
    }
    const userId = request.headers.get('x-user-id')!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'DELETE /api/announcements/[id] - User authorized',
    );

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can delete announcements');
    }

    logger.info(
      { traceId, announcementId },
      'DELETE /api/announcements/[id] - Deleting announcement',
    );

    await deleteAnnouncement({
      announcementId,
      associationId: association.id,
      authorId: userId,
    });

    logger.info({ traceId, announcementId }, 'DELETE /api/announcements/[id] - Success');

    return SuccessResponse({ data: { success: true } });
  },
);

export const PATCH = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, announcementId: params?.announcementId },
      'PATCH /api/announcements/[id] - Request started',
    );

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new ForbiddenError('Invalid announcement id');
    }
    const userId = request.headers.get('x-user-id')!;
    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'PATCH /api/announcements/[id] - User authorized',
    );

    if (!hasHighRoleAccess(user.role)) {
      throw new ForbiddenError('Only high role users can publish/archive announcements');
    }

    const body = await request.json();
    const action = body.action;

    logger.info(
      { traceId, announcementId, action },
      'PATCH /api/announcements/[id] - Processing action',
    );

    if (action === 'publish') {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Published');
      return SuccessResponse({ data: announcement });
    }

    if (action === 'archive') {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.ARCHIVED,
        },
      });
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Archived');
      return SuccessResponse({ data: announcement });
    }

    if (action === 'unpublish') {
      const announcement = await updateAnnouncement({
        announcementId,
        associationId: association.id,
        authorId: userId,
        data: {
          status: AnnouncementStatus.DRAFT,
          publishedAt: null,
        },
      });
      logger.info({ traceId, announcementId }, 'PATCH /api/announcements/[id] - Unpublished');
      return SuccessResponse({ data: announcement });
    }

    throw new ForbiddenError('Invalid action. Use: publish, archive, or unpublish');
  },
);
