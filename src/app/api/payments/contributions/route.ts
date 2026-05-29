import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole, ContributionStatus } from '@prisma/client';
import { GenerateContributionsSchema, WaiveContributionSchema } from '@feature/payments/validators';
import {
  generateMonthlyContributions,
  markOverdueContributions,
  waiveContribution,
} from '@feature/payments/services/contribution.service';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { logger } from '@src/shared/logger/server';
import { z } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { pageNumberValidation } from '@src/shared/validators/common';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

const ContributionsQuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(Object.values(ContributionStatus) as [string, ...string[]]).optional(),
  userId: z.uuid().optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

/**
 * GET /api/payments/contributions
 *
 * List all contribution periods with filtering and pagination.
 *
 * Requires: FINANCE role or higher.
 */
export const GET = withAssociation(
  { query: ContributionsQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, query }, 'GET /api/payments/contributions - Request started');

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/contributions - User authorized');

    if (!query) {
      throw new ValidationError('Invalid query parameters');
    }

    const page = query.page || 1;
    const { status, userId, year, month } = query as {
      page: number;
      status?: ContributionStatus;
      userId?: string;
      year?: number;
      month?: number;
    };

    const where: Record<string, unknown> = {
      associationId: association.id,
    };

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (year) where.year = year;
    if (month) where.month = month;

    const { contributions, total } = await findContributionPeriods({
      where: where as Parameters<typeof findContributionPeriods>[0]['where'],
      page,
      pageSize: PAGE_SIZE,
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

    logger.info(
      { traceId, count: contributions.length },
      'GET /api/payments/contributions - Success',
    );

    return SuccessResponse({
      data: contributions,
      meta: buildPagination(total, page),
    });
  },
);

/**
 * POST /api/payments/contributions
 *
 * Generate monthly contribution period rows for all active members.
 * This can be called manually by an admin or triggered by a cron job.
 *
 * Idempotent — duplicate rows are skipped.
 *
 * Requires: FINANCE role or higher.
 */
export const POST = withAssociation(
  { body: GenerateContributionsSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      { traceId, year: body!.year, month: body!.month },
      'POST /api/payments/contributions - Request started',
    );

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'POST /api/payments/contributions - User authorized');

    logger.info(
      { traceId, year: body!.year, month: body!.month },
      'POST /api/payments/contributions - Generating contributions',
    );
    const count = await generateMonthlyContributions(association.id, body!.year, body!.month);

    // Also mark overdue contributions while we're at it
    const overdueCount = await markOverdueContributions(association.id);

    logger.info(
      { traceId, generated: count, markedOverdue: overdueCount },
      'POST /api/payments/contributions - Success',
    );

    return SuccessResponse(
      {
        data: {
          generated: count,
          markedOverdue: overdueCount,
        },
        message: `Generated ${count} contribution records, marked ${overdueCount} as overdue`,
      },
      201,
    );
  },
);

/**
 * PATCH /api/payments/contributions
 *
 * Waive a contribution period for a member.
 *
 * Requires: FINANCE role or higher.
 */
export const PATCH = withAssociation(
  { body: WaiveContributionSchema },
  async (_association, { body, traceId }, request) => {
    logger.info(
      { traceId, contributionPeriodId: body!.contributionPeriodId },
      'PATCH /api/payments/contributions - Request started',
    );

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'PATCH /api/payments/contributions - User authorized');

    const waived = await waiveContribution(body!.contributionPeriodId, body!.reason);

    logger.info(
      { traceId, contributionPeriodId: body!.contributionPeriodId },
      'PATCH /api/payments/contributions - Success',
    );

    return SuccessResponse(
      {
        data: waived,
        message: 'Contribution period waived successfully',
      },
      200,
    );
  },
);
