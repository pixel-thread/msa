import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { ProviderIdParamSchema, VerifyPaymentSchema } from "@src/features/payments/validators";
import { verifyTestPayment } from "@src/features/payments/services/payment.service";

export const POST = withAssociation(
  { params: ProviderIdParamSchema, body: VerifyPaymentSchema },
  async (association, { body }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const result = await verifyTestPayment({
      razorpayOrderId: body!.razorpayOrderId,
      razorpayPaymentId: body!.razorpayPaymentId,
      razorpaySignature: body!.razorpaySignature,
    });

    return SuccessResponse({
      data: result,
      message: "Test payment verified and completed successfully",
    });
  },
);
