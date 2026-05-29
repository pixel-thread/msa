import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import {
  UpdatePaymentProviderSchema,
  ProviderIdParamSchema,
} from '@src/features/payments/validators';
import {
  getProviderById,
  updateProvider,
  deleteProvider,
} from '@src/features/payments/services/payment-provider.service';
import { NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';

export const GET = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info(
      { traceId, providerId: params!.providerId },
      'GET /api/payments/providers/[providerId] - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: params!.providerId },
      'GET /api/payments/providers/[providerId] - User authorized',
    );
    const provider = await getProviderById(params!.providerId, association.id);

    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    logger.info(
      { traceId, providerId: params!.providerId },
      'GET /api/payments/providers/[providerId] - Success',
    );

    return SuccessResponse({ data: provider });
  },
);

export const PATCH = withAssociation(
  { params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info(
      { traceId, providerId: params!.providerId },
      'PATCH /api/payments/providers/[providerId] - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: params!.providerId },
      'PATCH /api/payments/providers/[providerId] - User authorized',
    );
    logger.info(
      { traceId, providerId: params!.providerId },
      'PATCH /api/payments/providers/[providerId] - Updating provider',
    );

    const result = await updateProvider(params!.providerId, association.id, {
      keyId: body?.keyId,
      keySecret: body?.keySecret,
      webhookSecret: body?.webhookSecret,
      isActive: body?.isActive,
    });

    logger.info(
      { traceId, providerId: params!.providerId },
      'PATCH /api/payments/providers/[providerId] - Success',
    );

    return SuccessResponse({ data: result });
  },
);

export const DELETE = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info(
      { traceId, providerId: params!.providerId },
      'DELETE /api/payments/providers/[providerId] - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: params!.providerId },
      'DELETE /api/payments/providers/[providerId] - User authorized',
    );

    await deleteProvider(params!.providerId, association.id);
    logger.info(
      { traceId, providerId: params!.providerId },
      'DELETE /api/payments/providers/[providerId] - Success',
    );

    return SuccessResponse({
      data: null,
      message: 'Provider deleted successfully',
    });
  },
);
