import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { ProviderIdParamSchema, VerifyPaymentSchema } from "@src/features/payments/validators";
import { verifyTestPayment } from "@src/features/payments/services/payment.service";

export const POST = withAssociation(
  { params: ProviderIdParamSchema, body: VerifyPaymentSchema },
  async (association, { body, traceId }, req) => {
    logger.info("POST /api/payments/providers/[providerId]/test/verify - Request started", { traceId });

    await withRole(req, UserRole.PRESIDENT);
    logger.info("POST /api/payments/providers/[providerId]/test/verify - User authorized", { traceId });

    logger.info("POST /api/payments/providers/[providerId]/test/verify - Verifying test payment", { traceId, razorpayOrderId: body!.razorpayOrderId });

    const result = await verifyTestPayment({
      razorpayOrderId: body!.razorpayOrderId,
      razorpayPaymentId: body!.razorpayPaymentId,
      razorpaySignature: body!.razorpaySignature,
    });

    logger.info("POST /api/payments/providers/[providerId]/test/verify - Success", { traceId });

    return SuccessResponse({
      data: result,
      message: "Test payment verified and completed successfully",
    });
  },
);
