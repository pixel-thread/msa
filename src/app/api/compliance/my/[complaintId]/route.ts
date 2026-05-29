import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { ComplaintParamsSchema } from '@src/features/compliance/validators';
import { findUniqueComplaint } from '@src/features/compliance/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { params: ComplaintParamsSchema },
  async (association, { params, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
        complaintId: params?.complaintId,
      },
      'GET /api/compliance/my/[complaintId] - Request started',
    );
    if (!params) {
      logger.error(
        { traceId },
        'GET /api/compliance/my/[complaintId] - Invalid complaint ID (missing params)',
      );
      throw new BadRequestError('Invalid complaint ID');
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      logger.error(
        { traceId },
        'GET /api/compliance/my/[complaintId] - Unauthorized (missing x-user-id)',
      );
      throw new UnauthorizedError('Unauthorized');
    }

    const complaint = await findUniqueComplaint({
      where: {
        id: params.complaintId,
        associationId: association.id,
        userId,
      },
    });

    if (!complaint) {
      logger.error(
        { traceId, complaintId: params.complaintId },
        'GET /api/compliance/my/[complaintId] - Complaint not found',
      );
      throw new NotFoundError('Complaint not found');
    }

    logger.info(
      { traceId, complaintId: params.complaintId },
      'GET /api/compliance/my/[complaintId] - Success',
    );

    return SuccessResponse({ data: complaint });
  },
);
