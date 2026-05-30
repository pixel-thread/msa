// ---------------------------------------------------------------------------
// ENDPOINT:  POST /api/payments/record
// SECURITY:  Requires FINANCE role
// PURPOSE:   Record a manual (offline) payment — cash, UPI, bank transfer, or
//            cheque — on behalf of a member. Allocates the payment to
//            outstanding contribution periods (FIFO) and creates ledger entries.
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
import { RecordManualPaymentSchema } from '@src/features/payments/validators';
import { recordManualPayment } from '@src/features/payments/services/payment.service';
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

export const recordPayment: RequestHandler[] = [
  // Step 1: Validate request body
  validate({ body: RecordManualPaymentSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, userId: req.body.userId },
      'POST /api/payments/record - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce FINANCE role ---
    // Only finance officers can record payments on behalf of others
    const user = await withRole(req, UserRole.FINANCE);
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/record - User authorized');

    // --- Business logic: record the manual payment ---
    logger.info(
      { traceId, targetUserId: req.body.userId, amount: req.body.amount },
      'POST /api/payments/record - Recording manual payment',
    );
    const transaction = await recordManualPayment({
      associationId: association.id,
      userId: req.body.userId,
      amount: req.body.amount,
      method: req.body.method,
      notes: req.body.notes,
      receiptNumber: req.body.receiptNumber,
      referenceNumber: req.body.referenceNumber,
      createdById: user.id,
    });

    // --- Log: success ---
    logger.info({ traceId, transactionId: transaction.id }, 'POST /api/payments/record - Success');

    // --- Response ---
    return success(
      res,
      { data: transaction, message: 'Payment recorded and allocated successfully' },
      201,
    );
  }),
];
