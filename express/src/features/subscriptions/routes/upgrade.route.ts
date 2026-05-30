// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { upgradeSubscription } from '@feature/subscriptions/services';

// ---- Schemas -----------------------------------------------------------------

/** Schema for subscription upgrade request. */
const UpgradeSchema = z.object({
  planId: z.uuid(),
});

// ---- POST /api/subscriptions/upgrade -----------------------------------------
/** @desc  Upgrade the current user's subscription to a new plan
 *  @role  MEMBER */
export const postUpgrade: RequestHandler[] = [
  validate({ body: UpgradeSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/upgrade - Request started',
    );

    // Authorize user — MEMBER is the minimum
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!req.body) throw new ValidationError('Invalid request body');

    // Upgrade subscription to the target plan version
    const updated = await upgradeSubscription({
      planId: req.body.planId,
      userId: user.id,
    });

    logger.info({ traceId, subscriptionId: updated.id }, 'Subscription upgraded');

    return success(res, { data: updated });
  }),
];
