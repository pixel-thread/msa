import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { WaiveSubscriptionSchema } from '@feature/subscriptions/validators';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { waiveSubscription } from '@feature/subscriptions/services';

export const POST = withAssociation(
  { body: WaiveSubscriptionSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/waive - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!body) throw new ValidationError('Invalid request body');

    const updated = await waiveSubscription({
      subscriptionId: body.subscriptionId,
      reason: body.reason,
      userId: user.id,
      associationId: association.id,
    });

    logger.info({ traceId, subscriptionId: body.subscriptionId }, 'Subscription waived');

    return SuccessResponse({ data: updated });
  },
);
