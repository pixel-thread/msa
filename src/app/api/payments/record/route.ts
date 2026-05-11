import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
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
  async (association, { body }, request) => {
    const user = await withRole(request, UserRole.FINANCE);

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

    return SuccessResponse(
      {
        data: transaction,
        message: "Payment recorded and allocated successfully",
      },
      201,
    );
  },
);
