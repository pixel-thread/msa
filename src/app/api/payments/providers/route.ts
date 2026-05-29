import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UpsertPaymentProviderSchema } from '@src/features/payments/validators';
import {
  getProvidersByAssociation,
  createProvider,
} from '@src/features/payments/services/payment-provider.service';
import { PaymentProviderType } from '@prisma/client';

export const POST = withAssociation(
  { body: UpsertPaymentProviderSchema },
  async (association, { body, traceId }) => {
    logger.info(
      { traceId, provider: body!.provider },
      'POST /api/payments/providers - Request started',
    );

    const result = await createProvider({
      associationId: association.id,
      provider: body!.provider as PaymentProviderType,
      keyId: body!.keyId,
      keySecret: body!.keySecret,
      webhookSecret: body!.webhookSecret,
      isActive: body!.isActive,
    });

    logger.info({ traceId, providerId: result.id }, 'POST /api/payments/providers - Success');

    return SuccessResponse({ data: result }, 201);
  },
);

export const GET = withAssociation({}, async (association, { traceId }) => {
  logger.info({ traceId }, 'GET /api/payments/providers - Request started');

  const providers = await getProvidersByAssociation(association.id);

  logger.info({ traceId, count: providers.length }, 'GET /api/payments/providers - Success');

  return SuccessResponse({ data: providers });
});
