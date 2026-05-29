import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { pageNumberValidation } from '@src/shared/validators/common';
import z from 'zod';
import { logger } from '@src/shared/logger/server';
import { getSubscriptionPayments } from '@feature/subscriptions/services';

const SubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid('Invalid subscription ID'),
});

const SubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { params: SubscriptionParamsSchema, query: SubscriptionQuerySchema },
  async (association, { query, params, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/[subscriptionId]/payments - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    const page = query?.page || 1;
    const subscriptionId = params!.subscriptionId;

    const result = await getSubscriptionPayments({
      subscriptionId,
      userId: user.id,
      role: user.role,
      associationId: association.id,
      page,
    });

    logger.info({ traceId, subscriptionId, count: result.data.length }, 'Payments fetched');

    return SuccessResponse(result);
  },
);
