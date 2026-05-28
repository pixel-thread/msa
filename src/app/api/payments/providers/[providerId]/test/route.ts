import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { ProviderIdParamSchema } from "@src/features/payments/validators";
import { createTestPaymentOrder } from "@src/features/payments/services/payment.service";
import { getProviderById } from "@src/features/payments/services/payment-provider.service";
import { BadRequestError, NotFoundError } from "@src/shared/errors";

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }, req) => {
    const user = await withRole(req, UserRole.PRESIDENT);

    const provider = await getProviderById(
      params!.providerId,
      association.id,
    );

    if (!provider) {
      throw new NotFoundError("Provider not found");
    }

    if (provider.provider !== "RAZORPAY") {
      throw new BadRequestError("Test payments are only supported for Razorpay providers");
    }

    const options = await createTestPaymentOrder({
      associationId: association.id,
      userId: user.id,
      providerId: params!.providerId,
    });

    return SuccessResponse({ data: options }, 201);
  },
);
