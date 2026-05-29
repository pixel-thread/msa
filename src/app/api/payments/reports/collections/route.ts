import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { CollectionReportQuerySchema } from '@feature/payments/validators';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { PAGE_SIZE } from '@src/shared/constants';

/**
 * GET /api/payments/reports/collections
 *
 * Flattened data optimized for reporting and export.
 * Mapping payments to members and specific contribution periods.
 *
 * Role: FINANCE+
 */
export const GET = withAssociation(
  { query: CollectionReportQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info(
      { traceId, year: query!.year, month: query!.month },
      'GET /api/payments/reports/collections - Request started',
    );

    await withRole(request, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/reports/collections - User authorized');

    const { contributions: collections, total } = await findContributionPeriods({
      where: {
        associationId: association.id,
        year: query!.year,
        month: query!.month,
        status: query!.status,
      },
      page: query!.page,
      pageSize: PAGE_SIZE,
      include: {
        user: {
          select: {
            name: true,
            membershipNumber: true,
          },
        },
        allocations: {
          include: {
            paymentTransaction: true,
          },
        },
      },
    });

    logger.info(
      { traceId, count: collections.length, total },
      'GET /api/payments/reports/collections - Success',
    );

    return SuccessResponse({
      data: collections,
      meta: buildPagination(total, query!.page),
    });
  },
);
