import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { SubscribeSchema } from '@feature/subscriptions/validators';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { subscribe } from '@feature/subscriptions/services';

export const POST = withAssociation(
  { body: SubscribeSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/subscribe - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const subscription = await subscribe({
      planId: body.planId,
      userId: user.id,
      associationId: association.id,
    });

    logger.info({ traceId, subscriptionId: subscription.id }, 'Subscription created');

    return SuccessResponse({ data: subscription }, 201);
  },
);
