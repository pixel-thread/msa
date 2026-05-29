import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { getUserContributionSummary } from '@src/features/payments/services/contribution.service';
import { findPaymentTransactions } from '@src/features/payments/services/findPaymentTransactions';
import { pageNumberValidation } from '@src/shared/validators/common';
import { buildPagination } from '@src/shared/utils/build-pagination';

const UserPaymentsParamsSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});
const UserPaymentsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { params: UserPaymentsParamsSchema, query: UserPaymentsQuerySchema },
  async (association, { params, query, traceId }, request) => {
    logger.info(
      { traceId, userId: params?.userId },
      'GET /api/payments/users/[userId] - Request started',
    );

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/users/[userId] - User authorized');

    if (!params) {
      throw new ValidationError('Missing user ID parameter');
    }

    const { userId } = params as { userId: string };
    const page = query?.page || 1;

    const user = await findFirstMember({
      where: { id: userId, associationId: association.id },
    });

    if (!user) {
      throw new NotFoundError('User not found in this association');
    }

    logger.info({ traceId, userId }, 'GET /api/payments/users/[userId] - Fetching transactions');

    const { transactions, total } = await findPaymentTransactions({
      where: { userId, associationId: association.id },
      page,
      pageSize: 10,
      include: {
        allocations: {
          include: {
            contributionPeriod: {
              select: {
                year: true,
                month: true,
                expectedAmount: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const summary = await getUserContributionSummary(userId);

    logger.info(
      { traceId, userId, count: transactions.length, total },
      'GET /api/payments/users/[userId] - Success',
    );

    return SuccessResponse({
      data: {
        user,
        transactions,
        summary,
      },
      meta: buildPagination(total, page),
    });
  },
);
