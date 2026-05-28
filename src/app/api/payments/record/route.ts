import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { RecordManualPaymentSchema } from "@feature/payments/validators";
import { recordManualPayment } from "@feature/payments/services/payment.service";

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
    logger.info("POST /api/payments/record - Request started", { traceId, userId: body!.userId });

    const user = await withRole(request, UserRole.FINANCE);
    logger.info("POST /api/payments/record - User authorized", { traceId, userId: user.id });

    logger.info("POST /api/payments/record - Recording manual payment", { traceId, targetUserId: body!.userId, amount: body!.amount });

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

    logger.info("POST /api/payments/record - Success", { traceId, transactionId: transaction.id });

    return SuccessResponse(
      {
        data: transaction,
        message: "Payment recorded and allocated successfully",
      },
      201,
    );
  },
);
