import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger/server';
import { getMySubscription } from '@feature/subscriptions/services';

const MySubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: MySubscriptionQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/my - Request started',
    );

    const page = query?.page || 1;
    const user = await withRole(request, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    const result = await getMySubscription(user.id, page);

    return SuccessResponse(result);
  },
);
