// ---------------------------------------------------------------------------
// ENDPOINT:  GET /api/payments/:paymentId
// SECURITY:  Requires MEMBER role; members can only view their own payments
//            unless they hold a finance/admin role.
// PURPOSE:   Fetch a single payment transaction by ID with full context
//            (user info, allocations, ledger entries).
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { getTransactionById } from '@src/features/payments/services/payment.service';
import { validate } from '@src/shared/lib/validate';
import { z } from 'zod';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Validation schemas ----

const PaymentIdParamSchema = z.object({ paymentId: z.uuid() });

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

export const getPayment: RequestHandler[] = [
  // Step 1: Validate path params
  validate({ params: PaymentIdParamSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId }, 'GET /api/payments/[id] - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce MEMBER role ---
    const paymentId = req.params.paymentId;
    if (!paymentId) throw new NotFoundError('Payment ID');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, paymentId },
      'GET /api/payments/[id] - User authorized',
    );

    // --- Business logic: fetch transaction ---
    const transaction = await getTransactionById(paymentId as string, association.id);
    if (!transaction) throw new NotFoundError('Transaction');

    // --- Authorization check: is the user allowed to see this transaction? ---
    // Finance, Secretary, President, and Super Admin can see any transaction.
    // Regular members can only see their own.
    const adminRoles: UserRole[] = [
      UserRole.FINANCE,
      UserRole.SECRETARY,
      UserRole.PRESIDENT,
      UserRole.SUPER_ADMIN,
    ];
    const isFinance = user.role.some((r) => adminRoles.includes(r));
    if (!isFinance && transaction.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to view this transaction');
    }

    // --- Log: success ---
    logger.info({ traceId, paymentId }, 'GET /api/payments/[id] - Success');

    // --- Response ---
    return success(res, { data: transaction });
  }),
];
