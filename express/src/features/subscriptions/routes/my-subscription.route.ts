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
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { pageNumberValidation } from '@src/shared/validators/common';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { getMySubscription } from '@feature/subscriptions/services';

// ---- Schemas -----------------------------------------------------------------

/** Schema for paginated my-subscription query. */
const MySubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

// ---- GET /api/subscriptions/my -----------------------------------------------
/** @desc  Retrieve the current user's own subscriptions (paginated)
 *  @role  MEMBER */
export const getMySubscriptionHandler: RequestHandler[] = [
  validate({ query: MySubscriptionQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/my - Request started',
    );

    const page = (req.query as any)?.page || 1;

    // Authorize user — MEMBER is the minimum
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');

    // Fetch the user's subscriptions with pagination
    const result = await getMySubscription(user.id, page);

    return success(res, result);
  }),
];
