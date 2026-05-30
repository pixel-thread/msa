// ---------------------------------------------------------------------------
// ENDPOINT:  GET /api/payments
// SECURITY:  Requires FINANCE role
// PURPOSE:   List all payment transactions for the association with advanced
//            filtering (status, method, gateway, date range, search).
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { GetTransactionsQuerySchema } from '@src/features/payments/validators';
import { getAllTransactions } from '@src/features/payments/services/payment.service';
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

export const listPayments: RequestHandler[] = [
  // Step 1: Validate query params
  validate({ query: GetTransactionsQuerySchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId, query: req.query }, 'GET /api/payments - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce FINANCE role ---
    // Only finance officers should view all transactions
    await withRole(req, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments - User authorized');

    // --- Business logic: fetch filtered transactions ---
    const result = await getAllTransactions(association.id, (req.query as any) || {});

    // --- Log: success ---
    logger.info({ traceId, count: result.transactions.length }, 'GET /api/payments - Success');

    // --- Response ---
    return success(res, { data: result.transactions, meta: result.pagination });
  }),
];
