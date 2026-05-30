import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@src/shared/logger';
import { upgradeSubscription } from '@feature/subscriptions/services';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for subscription upgrade request. */
const UpgradeSchema = z.object({
  planId: z.uuid(),
});

/** POST /api/subscriptions/upgrade - Upgrade the current user's subscription. */
export const postUpgrade: RequestHandler[] = [
  validate({ body: UpgradeSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/upgrade - Request started',
    );
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');
    if (!req.body) throw new ValidationError('Invalid request body');
    const updated = await upgradeSubscription({
      planId: req.body.planId,
      userId: user.id,
    });
    logger.info({ traceId, subscriptionId: updated.id }, 'Subscription upgraded');
    return success(res, { data: updated });
  }),
];
