import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { ProviderIdParamSchema } from "@src/features/payments/validators";
import { createTestPaymentOrder } from "@src/features/payments/services/payment.service";
import { getProviderById } from "@src/features/payments/services/payment-provider.service";
import { BadRequestError, NotFoundError } from "@src/shared/errors";

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info("POST /api/payments/providers/[providerId]/test - Request started", { traceId, providerId: params!.providerId });

    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info("POST /api/payments/providers/[providerId]/test - User authorized", { traceId, userId: user.id, providerId: params!.providerId });

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

    logger.info("POST /api/payments/providers/[providerId]/test - Creating test payment order", { traceId, providerId: params!.providerId });

    const options = await createTestPaymentOrder({
      associationId: association.id,
      userId: user.id,
      providerId: params!.providerId,
    });

    logger.info("POST /api/payments/providers/[providerId]/test - Success", { traceId, providerId: params!.providerId, orderId: (options as any).id });

    return SuccessResponse({ data: options }, 201);
  },
);
