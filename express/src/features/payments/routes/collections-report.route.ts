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

export const collectionsReport: RequestHandler[] = [
  validate({ query: CollectionReportQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const query = req.query as any;
    logger.info(
      { traceId, year: query.year, month: query.month },
      'GET /api/payments/reports/collections - Request started',
    );
    const association = await getAssociation(req);
    await withRole(req, UserRole.FINANCE);
    logger.info({ traceId }, 'GET /api/payments/reports/collections - User authorized');
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
    logger.info(
      { traceId, count: collections.length, total },
      'GET /api/payments/reports/collections - Success',
    );
    return success(res, { data: collections, meta: buildPagination(total, query.page) });
  }),
];
