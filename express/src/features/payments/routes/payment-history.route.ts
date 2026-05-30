// ---------------------------------------------------------------------------
// ENDPOINT:  GET /api/payments/history
// SECURITY:  Authenticated user (any role)
// PURPOSE:   Fetch the authenticated user's full payment history PLUS a
//            contribution summary (totals, overdue months, etc.).
//            Convenience endpoint returning both in one call.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { PaymentHistoryQuerySchema } from '@src/features/payments/validators';
import { getUserPaymentHistory } from '@src/features/payments/services/payment.service';
import { getUserContributionSummary } from '@src/features/payments/services/contribution.service';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Helpers ----

/**
 * Resolve the authenticated user's association for multi-tenant scoping.
 */
async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

// ---- Handler ----

export const paymentHistory: RequestHandler[] = [
  // Step 1: Validate query params
  validate({ query: PaymentHistoryQuerySchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId, query: req.query }, 'GET /api/payments/history - Request started');

    // --- Auth: ensure user belongs to an association ---
    await getAssociation(req);

    // --- Business logic: fetch history and summary in parallel ---
    const userId = req.userId as string;
    const page = (req.query as any)?.page ?? 1;
    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page),
      getUserContributionSummary(userId),
    ]);

    // --- Log: success ---
    logger.info(
      { traceId, count: history.transactions.length },
      'GET /api/payments/history - Success',
    );

    // --- Response ---
    return success(res, {
      data: { transactions: history.transactions, summary },
      meta: history.pagination,
    });
  }),
];
