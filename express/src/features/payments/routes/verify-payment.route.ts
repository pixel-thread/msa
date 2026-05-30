// ---------------------------------------------------------------------------
// ENDPOINT:  POST /api/payments/verify
// SECURITY:  Authenticated user (any role); validates Razorpay callback
// PURPOSE:   Verify the Razorpay payment signature returned from the
//            client-side checkout and complete the transaction.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { VerifyPaymentSchema } from '@src/features/payments/validators';
import { verifyAndCompletePayment } from '@src/features/payments/services/payment.service';
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

export const verifyPayment: RequestHandler[] = [
  // Step 1: Validate request body
  validate({ body: VerifyPaymentSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Request started',
    );

    // --- Auth: ensure user belongs to an association (scoping) ---
    await getAssociation(req);

    // --- Business logic: verify signature & complete payment ---
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Verifying payment',
    );
    const result = await verifyAndCompletePayment({
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
      razorpaySignature: req.body.razorpaySignature,
    });

    // --- Log: success ---
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Success',
    );

    // --- Response ---
    return success(
      res,
      { data: result, message: 'Payment verified and completed successfully' },
      200,
    );
  }),
];
