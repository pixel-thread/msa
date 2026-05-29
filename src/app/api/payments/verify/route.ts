import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { logger } from '@src/shared/logger/server';
import { VerifyPaymentSchema } from '@feature/payments/validators';
import { verifyAndCompletePayment } from '@feature/payments/services/payment.service';

/**
 * POST /api/payments/verify
 *
 * Verify a Razorpay payment after the client-side checkout callback.
 *
 * The frontend sends:
 *   - razorpayOrderId
 *   - razorpayPaymentId
 *   - razorpaySignature
 *
 * The server verifies the signature, marks the transaction as COMPLETED,
 * allocates the payment to contribution periods, and creates ledger entries.
 */
export const POST = withAssociation(
  { body: VerifyPaymentSchema },
  async (_association, { body, traceId }) => {
    logger.info(
      { traceId, razorpayOrderId: body!.razorpayOrderId },
      'POST /api/payments/verify - Request started',
    );

    logger.info(
      { traceId, razorpayOrderId: body!.razorpayOrderId },
      'POST /api/payments/verify - Verifying payment',
    );

    const result = await verifyAndCompletePayment({
      razorpayOrderId: body!.razorpayOrderId,
      razorpayPaymentId: body!.razorpayPaymentId,
      razorpaySignature: body!.razorpaySignature,
    });

    logger.info(
      { traceId, razorpayOrderId: body!.razorpayOrderId },
      'POST /api/payments/verify - Success',
    );

    return SuccessResponse(
      {
        data: result,
        message: 'Payment verified and completed successfully',
      },
      200,
    );
  },
);
