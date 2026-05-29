import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findManyMeetings } from '@src/features/meetings/services/findManyMeetings';
import { pageNumberValidation } from '@src/shared/validators';
import { logger } from '@src/shared/logger/server';
import { z } from 'zod';

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/meetings/my - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, role: user.role },
      'GET /api/meetings/my - User authorized',
    );

    const userId = request.headers.get('x-user-id')!;
    const page = query?.page || 1;

    const { meetings, pagination } = await findManyMeetings({
      associationId: association.id,
      userId,
      role: user.role,
      pagination: { page },
    });

    logger.info({ traceId, count: meetings.length }, 'GET /api/meetings/my - Success');

    return SuccessResponse({
      data: meetings,
      meta: pagination,
    });
  },
);
