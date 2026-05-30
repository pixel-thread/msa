import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { SubscribeSchema } from '@feature/subscriptions/validators';
import { logger } from '@src/shared/logger';
import { subscribe } from '@feature/subscriptions/services';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';

export const postSubscribe = [
  validate({ body: SubscribeSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /api/subscriptions/subscribe - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    if (!req.body) throw new ValidationError('Invalid request body');
    const subscription = await subscribe({
      planId: req.body.planId,
      userId: user.id,
      associationId: association.id,
    });
    logger.info({ traceId, subscriptionId: subscription.id }, 'Subscription created');
    return success(res, { data: subscription }, 201);
  },
];
