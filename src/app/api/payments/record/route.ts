import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { RecordManualPaymentSchema } from '@feature/payments/validators';
import { recordManualPayment } from '@feature/payments/services/payment.service';

/**
 * POST /api/payments/record
 *
 * Record a manual (offline) payment — cash, UPI, bank transfer, cheque.
 *
 * This is used by finance officers to log payments that happened outside
 * the Razorpay flow. The payment is immediately marked as COMPLETED and
 * allocated to contribution periods.
 *
 * Requires: FINANCE role or higher.
 */
export const POST = withAssociation(
  { body: RecordManualPaymentSchema },
  async (association, { body, traceId }, request) => {
    logger.info({ traceId, userId: body!.userId }, 'POST /api/payments/record - Request started');

    const user = await withRole(request, UserRole.FINANCE);
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/record - User authorized');

    logger.info(
      { traceId, targetUserId: body!.userId, amount: body!.amount },
      'POST /api/payments/record - Recording manual payment',
    );

    const transaction = await recordManualPayment({
      associationId: association.id,
      userId: body!.userId,
      amount: body!.amount,
      method: body!.method,
      notes: body!.notes,
      receiptNumber: body!.receiptNumber,
      referenceNumber: body!.referenceNumber,
      createdById: user.id,
    });

    logger.info({ traceId, transactionId: transaction.id }, 'POST /api/payments/record - Success');

    return SuccessResponse(
      {
        data: transaction,
        message: 'Payment recorded and allocated successfully',
      },
      201,
    );
  },
);
