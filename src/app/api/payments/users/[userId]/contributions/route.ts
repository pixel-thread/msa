import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { getUserContributionSummary } from '@src/features/payments/services/contribution.service';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { pageNumberValidation } from '@src/shared/validators';
import { PAGE_SIZE } from '@src/shared/constants';

const UserContributionsParamsSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});
const UserContributionsQuerySchema = z.object({
  page: pageNumberValidation,
  fromYear: z.coerce.number().int().min(2020).max(2100).optional(),
  fromMonth: z.coerce.number().int().min(1).max(12).optional(),
  toYear: z.coerce.number().int().min(2020).max(2100).optional(),
  toMonth: z.coerce.number().int().min(1).max(12).optional(),
});

export const GET = withAssociation(
  {
    params: UserContributionsParamsSchema,
    query: UserContributionsQuerySchema,
  },
  async (association, { params, query, traceId }, request) => {
    logger.info(
      { traceId, userId: params?.userId },
      'GET /api/payments/users/[userId]/contributions - Request started',
    );

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/users/[userId]/contributions - User authorized');

    if (!params) {
      throw new ValidationError('Missing user ID parameter');
    }

    const { userId } = params as { userId: string };
    const {
      page = 1,
      fromYear,
      fromMonth,
      toYear,
      toMonth,
    } = (query as {
      page?: number;
      fromYear?: number;
      fromMonth?: number;
      toYear?: number;
      toMonth?: number;
    }) || {};

    const user = await findFirstMember({
      where: { id: userId, associationId: association.id },
    });

    if (!user) {
      throw new NotFoundError('User not found in this association');
    }

    const whereClause: Record<string, unknown> = {
      userId,
      associationId: association.id,
    };

    if (fromYear && fromMonth) {
      whereClause.AND = whereClause.AND
        ? [
            ...(whereClause.AND as unknown[]),
            {
              OR: [{ year: { gt: fromYear } }, { year: fromYear, month: { gte: fromMonth } }],
            },
          ]
        : [
            {
              OR: [{ year: { gt: fromYear } }, { year: fromYear, month: { gte: fromMonth } }],
            },
          ];
    }

    if (toYear && toMonth) {
      const toClause = {
        OR: [{ year: { lt: toYear } }, { year: toYear, month: { lte: toMonth } }],
      };
      whereClause.AND = whereClause.AND
        ? [...(whereClause.AND as unknown[]), toClause]
        : [toClause];
    }

    logger.info(
      { traceId, userId },
      'GET /api/payments/users/[userId]/contributions - Fetching contributions',
    );

    const { contributions, total } = await findContributionPeriods({
      where: whereClause as Parameters<typeof findContributionPeriods>[0]['where'],
      page,
      pageSize: PAGE_SIZE,
      include: {
        allocations: {
          include: {
            paymentTransaction: {
              select: {
                id: true,
                amount: true,
                method: true,
                gateway: true,
                status: true,
                paidAt: true,
                receiptNumber: true,
              },
            },
          },
        },
      },
    });

    const summary = await getUserContributionSummary(userId);

    logger.info(
      { traceId, userId, count: contributions.length, total },
      'GET /api/payments/users/[userId]/contributions - Success',
    );

    return SuccessResponse({
      data: {
        user,
        contributions,
        summary,
      },
      meta: buildPagination(total, page),
    });
  },
);
