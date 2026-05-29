import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { ConsentService } from '@src/features/consent';
import {
  ConsentReceiptParamsSchema,
  UpdateConsentReceiptSchema,
} from '@src/features/consent/validators/consent.validators';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        receiptId: params?.receiptId,
      },
      'GET /api/consent/[receiptId] - Request started',
    );

    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/consent/[receiptId] - User authorized',
    );

    if (!params) throw new BadRequestError('Invalid receipt ID');

    const receipt = await ConsentService.findUniqueConsentReceipt(association.id, params.receiptId);
    if (!receipt) throw new NotFoundError('Consent receipt not found');

    logger.info({ traceId }, 'GET /api/consent/[receiptId] - Success');

    return SuccessResponse({ data: receipt });
  },
);

export const PATCH = withAssociation(
  { params: ConsentReceiptParamsSchema, body: UpdateConsentReceiptSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        receiptId: params?.receiptId,
      },
      'PATCH /api/consent/[receiptId] - Request started',
    );

    if (!params) throw new BadRequestError('Invalid receipt ID');
    if (!body) throw new BadRequestError('Request body is required');

    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'PATCH /api/consent/[receiptId] - User authorized',
    );

    const receipt = await ConsentService.updateConsentReceipt(
      association.id,
      params.receiptId,
      user.id,
      body,
    );

    logger.info({ traceId }, 'PATCH /api/consent/[receiptId] - Success');

    return SuccessResponse({
      data: receipt,
      message: 'Consent receipt updated successfully',
    });
  },
);

export const DELETE = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        receiptId: params?.receiptId,
      },
      'DELETE /api/consent/[receiptId] - Request started',
    );

    if (!params) throw new BadRequestError('Invalid receipt ID');

    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'DELETE /api/consent/[receiptId] - User authorized',
    );

    await ConsentService.deleteConsentReceipt(association.id, params.receiptId, user.id);

    logger.info({ traceId }, 'DELETE /api/consent/[receiptId] - Success');

    return SuccessResponse({
      data: null,
      message: 'Consent receipt deleted successfully',
    });
  },
);
