import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { UserRole, AnnouncementStatus } from '@prisma/client';
import { createAnnouncement, findManyAnnouncements } from '@feature/announcement/services';
import {
  CreateAnnouncementSchema,
  AnnouncementQuerySchema,
} from '@feature/announcement/validators';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';

export const GET = withAssociation(
  { query: AnnouncementQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, query }, 'GET /api/announcements - Request started');

    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/announcements - User authorized',
    );

    if (!query) {
      throw new ForbiddenError('Invalid query parameters');
    }

    const { page, priority, search, status } = query;
    if (hasHighRoleAccess(user.role)) {
      logger.info(
        {
          traceId,
          associationId: association.id,
          page,
          priority,
          search,
          status,
        },
        'GET /api/announcements - High role: fetching all announcements',
      );

      const result = await findManyAnnouncements({
        associationId: association.id,
        filters: { priority, search, status },
        pagination: { page },
      });

      logger.info(
        { traceId, count: result.announcements.length },
        'GET /api/announcements - Success',
      );

      return SuccessResponse({
        data: result.announcements,
        meta: result.pagination,
      });
    }

    logger.info(
      {
        traceId,
        associationId: association.id,
        page,
        priority,
        search,
      },
      'GET /api/announcements - Member: fetching published only',
    );

    const result = await findManyAnnouncements({
      associationId: association.id,
      filters: { status: 'PUBLISHED', priority, search },
      pagination: { page },
    });

    logger.info(
      { traceId, count: result.announcements.length },
      'GET /api/announcements - Success',
    );

    return SuccessResponse({
      data: result.announcements,
      meta: result.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: CreateAnnouncementSchema },
  async (association, { body, traceId }, request) => {
    logger.info({ traceId }, 'POST /api/announcements - Request started');

    const user = await withRole(request, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/announcements - User authorized',
    );

    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    const userId = request.headers.get('x-user-id')!;
    const isPublishing = body.status === AnnouncementStatus.PUBLISHED;

    logger.info(
      {
        traceId,
        associationId: association.id,
        title: body.title,
        status: body.status,
        isPublishing,
      },
      'POST /api/announcements - Creating announcement',
    );

    const announcement = await createAnnouncement({
      associationId: association.id,
      authorId: userId,
      data: {
        ...body,
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : isPublishing
            ? new Date()
            : undefined,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      },
      sendNotification: isPublishing,
    });

    logger.info({ traceId, announcementId: announcement.id }, 'POST /api/announcements - Success');

    return SuccessResponse({ data: announcement }, 201);
  },
);
