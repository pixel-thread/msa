import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { CollectionReportQuerySchema } from "@feature/payments/validators";
import { prisma } from "@src/shared/lib/prisma";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { PAGE_SIZE } from "@src/shared/constants";

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
    logger.info("GET /api/payments/reports/collections - Request started", { traceId, year: query!.year, month: query!.month });

    await withRole(request, UserRole.FINANCE);
    logger.info("GET /api/payments/reports/collections - User authorized", { traceId });

    const [collections, total] = await prisma.$transaction([
      prisma.contributionPeriod.findMany({
        where: {
          associationId: association.id,
          year: query!.year,
          month: query!.month,
          status: query!.status,
        },
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
        orderBy: { user: { name: "asc" } },
        take: PAGE_SIZE,
        skip: (query!.page - 1) * PAGE_SIZE,
      }),

      prisma.contributionPeriod.count({
        where: {
          associationId: association.id,
          year: query!.year,
          month: query!.month,
          status: query!.status,
        },
      }),
    ]);

    logger.info("GET /api/payments/reports/collections - Success", { traceId, count: collections.length, total });

    return SuccessResponse({
      data: collections,
      meta: buildPagination(total, query!.page),
    });
  },
);
