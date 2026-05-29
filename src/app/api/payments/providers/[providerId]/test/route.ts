import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { ProviderIdParamSchema } from '@src/features/payments/validators';
import { createTestPaymentOrder } from '@src/features/payments/services/payment.service';
import { getProviderById } from '@src/features/payments/services/payment-provider.service';
import { BadRequestError, NotFoundError } from '@src/shared/errors';

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info(
      { traceId, providerId: params!.providerId },
      'POST /api/payments/providers/[providerId]/test - Request started',
    );

    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id, providerId: params!.providerId },
      'POST /api/payments/providers/[providerId]/test - User authorized',
    );

    const provider = await getProviderById(params!.providerId, association.id);

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    if (provider.provider !== 'RAZORPAY') {
      throw new BadRequestError('Test payments are only supported for Razorpay providers');
    }

    logger.info(
      { traceId, providerId: params!.providerId },
      'POST /api/payments/providers/[providerId]/test - Creating test payment order',
    );

    const options = await createTestPaymentOrder({
      associationId: association.id,
      userId: user.id,
      providerId: params!.providerId,
    });

    logger.info(
      { traceId, providerId: params!.providerId, orderId: (options as any).id },
      'POST /api/payments/providers/[providerId]/test - Success',
    );

    return SuccessResponse({ data: options }, 201);
  },
);
