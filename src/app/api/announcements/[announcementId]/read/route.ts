import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { markAnnouncementRead } from '@feature/announcement/services';
import { NextRequest } from 'next/server';
import z from 'zod';

const RouteParams = z.object({
  announcementId: z.uuid(),
});

export const POST = withAssociation(
  { params: RouteParams },
  async (association, { params, traceId }, request: NextRequest) => {
    logger.info(
      { traceId, announcementId: params?.announcementId },
      'POST /api/announcements/[id]/read - Request started',
    );

    const announcementId = params?.announcementId;

    if (!announcementId) {
      throw new Error('Invalid announcement id');
    }

    const userId = request.headers.get('x-user-id')!;
    await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId, announcementId },
      'POST /api/announcements/[id]/read - User authorized',
    );

    const readReceipt = await markAnnouncementRead({
      announcementId,
      userId,
      associationId: association.id,
    });

    logger.info({ traceId, announcementId }, 'POST /api/announcements/[id]/read - Success');

    return SuccessResponse({
      data: readReceipt,
      message: 'Announcement marked as read',
    });
  },
);
