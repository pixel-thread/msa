// ---------------------------------------------------------------------------
// ENDPOINT:  GET /api/payments/reports/collections
// SECURITY:  Requires FINANCE role
// PURPOSE:   Fetch paginated contribution-period data for finance reports,
//            optionally filtered by year, month, and status.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { CollectionReportQuerySchema } from '@src/features/payments/validators';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { PAGE_SIZE } from '@src/shared/constants';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Helpers ----

/**
 * Resolve the authenticated user's association.
 *
 * Every payment route scopes data to the user's association for multi-tenant
 * isolation — users must never see data from associations they don't belong to.
 */
async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

// ---- Handler ----

export const collectionsReport: RequestHandler[] = [
  // Step 1: Validate query params
  validate({ query: CollectionReportQuerySchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    const query = req.query as any;
    logger.info(
      { traceId, year: query.year, month: query.month },
      'GET /api/payments/reports/collections - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce FINANCE role ---
    await withRole(req, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/reports/collections - User authorized');

    // --- Business logic: fetch contribution periods with filters ---
    const { contributions: collections, total } = await findContributionPeriods({
      where: {
        associationId: association.id,
        year: query.year,
        month: query.month,
        status: query.status,
      },
      page: query.page,
      pageSize: PAGE_SIZE,
      include: {
        user: { select: { name: true, membershipNumber: true } },
        allocations: { include: { paymentTransaction: true } },
      },
    });

    // --- Log: success ---
    logger.info(
      { traceId, count: collections.length, total },
      'GET /api/payments/reports/collections - Success',
    );

    // --- Response ---
    return success(res, { data: collections, meta: buildPagination(total, query.page) });
  }),
];
