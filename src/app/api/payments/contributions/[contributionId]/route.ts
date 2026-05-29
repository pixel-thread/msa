import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { z } from 'zod';
import { NotFoundError } from '@src/shared/errors';
import { findUniqueContributionPeriod } from '@src/features/payments/services/findUniqueContributionPeriod';

const ParamsSchema = z.object({
  contributionId: z.string().uuid('Invalid contribution ID'),
});

export const GET = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }) => {
    logger.info(
      { traceId, contributionId: params!.contributionId },
      'GET /api/payments/contributions/[contributionId] - Request started',
    );
    const contribution = await findUniqueContributionPeriod({
      where: {
        id: params!.contributionId,
        associationId: association.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipNumber: true,
          },
        },
        allocations: {
          include: {
            paymentTransaction: {
              select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                paidAt: true,
                receiptNumber: true,
              },
            },
          },
        },
      },
    });

    if (!contribution) {
      throw new NotFoundError('Contribution not found');
    }

    logger.info(
      { traceId, contributionId: params!.contributionId },
      'GET /api/payments/contributions/[contributionId] - Success',
    );

    return SuccessResponse({ data: contribution });
  },
);
