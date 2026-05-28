import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UpsertPaymentProviderSchema } from "@src/features/payments/validators";
import {
  getProvidersByAssociation,
  createProvider,
} from "@src/features/payments/services/payment-provider.service";
import { PaymentProviderType } from "@prisma/client";

export const POST = withAssociation(
  { body: UpsertPaymentProviderSchema },
  async (association, { body, traceId }) => {
    logger.info("POST /api/payments/providers - Request started", { traceId, provider: body!.provider });

    const result = await createProvider({
      associationId: association.id,
      provider: body!.provider as PaymentProviderType,
      keyId: body!.keyId,
      keySecret: body!.keySecret,
      webhookSecret: body!.webhookSecret,
      isActive: body!.isActive,
    });

    logger.info("POST /api/payments/providers - Success", { traceId, providerId: result.id });

    return SuccessResponse({ data: result }, 201);
  },
);

export const GET = withAssociation({}, async (association, { traceId }) => {
  logger.info("GET /api/payments/providers - Request started", { traceId });

  const providers = await getProvidersByAssociation(association.id);

  logger.info("GET /api/payments/providers - Success", { traceId, count: providers.length });

  return SuccessResponse({ data: providers });
});
