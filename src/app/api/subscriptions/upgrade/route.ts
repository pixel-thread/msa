import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';
import { upgradeSubscription } from '@feature/subscriptions/services';

const UpgradeSchema = z.object({
  planId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpgradeSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/upgrade - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const updated = await upgradeSubscription({
      planId: body.planId,
      userId: user.id,
    });

    logger.info({ traceId, subscriptionId: updated.id }, 'Subscription upgraded');

    return SuccessResponse({ data: updated });
  },
);
