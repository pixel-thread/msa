import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { ConsentService } from '@src/features/consent';
import { z } from 'zod';
import { pageNumberValidation } from '@src/shared/validators';
import { logger } from '@src/shared/logger/server';

const UserParamsSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});

const UserQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { params: UserParamsSchema, query: UserQuerySchema },
  async (association, { params, query, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        targetUserId: params?.userId,
      },
      'GET /api/consent/users/[userId] - Request started',
    );

    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/consent/users/[userId] - User authorized',
    );

    if (!params) throw new BadRequestError('Invalid user ID');
    const page = query?.page || 1;
    const data = await ConsentService.getUserConsentHistoryById(
      params.userId,
      association.id,
      page,
    );

    if (data.records.length === 0) {
      throw new NotFoundError('No consent records found for this user');
    }

    logger.info(
      {
        traceId,
        count: data.records.length,
      },
      'GET /api/consent/users/[userId] - Success',
    );

    return SuccessResponse({ data: data.records, meta: data.pagination });
  },
);
