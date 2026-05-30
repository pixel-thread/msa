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
import { getSubscriptionPayments } from '@feature/subscriptions/services';

// ---- Schemas -----------------------------------------------------------------

/** Schema for subscription ID path parameter. */
const SubscriptionParamsSchema = z.object({
  subscriptionId: z.uuid('Invalid subscription ID'),
});

/** Schema for paginated subscription payments query. */
const SubscriptionQuerySchema = z.object({
  page: pageNumberValidation,
});

// ---- GET /api/subscriptions/:subscriptionId/payments --------------------------
/** @desc  Retrieve paginated payments for a given subscription
 *  @role  MEMBER (scoped by ownership or high-role) */
export const getSubscriptionPaymentsHandler: RequestHandler[] = [
  validate({ params: SubscriptionParamsSchema, query: SubscriptionQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/subscriptions/[subscriptionId]/payments - Request started',
    );

    // Authorize user — MEMBER minimum; further ownership checks inside service
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'User authorized');

    const page = (req.query as any)?.page || 1;
    const subscriptionId = req.params.subscriptionId;

    // Fetch payments; service enforces that only the subscription owner or high-role users may view
    const result = await getSubscriptionPayments({
      subscriptionId: subscriptionId as string,
      userId: user.id,
      role: user.role,
      associationId: association.id,
      page,
    });

    logger.info({ traceId, subscriptionId, count: result.data.length }, 'Payments fetched');

    return success(res, result);
  }),
];
