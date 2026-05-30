// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

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
// Validators / Types
// ---------------------------------------------------------------------------
import { SubscribeSchema } from '@feature/subscriptions/validators';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { subscribe } from '@feature/subscriptions/services';

// ---- POST /api/subscriptions/subscribe ---------------------------------------
/** @desc  Subscribe the current user to a plan (creates or upserts)
 *  @role  MEMBER */
export const postSubscribe: RequestHandler[] = [
  validate({ body: SubscribeSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/subscriptions/subscribe - Request started',
    );

    // Authorize user — MEMBER is the minimum
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');

    if (!req.body) throw new ValidationError('Invalid request body');

    // Create or update the user's subscription to the requested plan
    const subscription = await subscribe({
      planId: req.body.planId,
      userId: user.id,
      associationId: association.id,
    });

    logger.info({ traceId, subscriptionId: subscription.id }, 'Subscription created');

    return success(res, { data: subscription }, 201);
  }),
];
