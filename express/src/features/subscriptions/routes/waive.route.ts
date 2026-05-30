import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { WaiveSubscriptionSchema } from '@feature/subscriptions/validators';
import { logger } from '@src/shared/logger';
import { waiveSubscription } from '@feature/subscriptions/services';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';

export const postWaive: RequestHandler[] = [
  validate({ body: WaiveSubscriptionSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/waive - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    if (!req.body) throw new ValidationError('Invalid request body');
    const updated = await waiveSubscription({
      subscriptionId: req.body.subscriptionId,
      reason: req.body.reason,
      userId: user.id,
      associationId: association.id,
    });
    logger.info({ traceId, subscriptionId: req.body.subscriptionId }, 'Subscription waived');
    return success(res, { data: updated });
  },
];
