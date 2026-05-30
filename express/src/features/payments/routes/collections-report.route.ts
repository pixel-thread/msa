import { Request, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { CollectionReportQuerySchema } from '@src/features/payments/validators';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { PAGE_SIZE } from '@src/shared/constants';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const collectionsReport = [
  validate({ query: CollectionReportQuerySchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const query = req.query as any;
    logger.info({ traceId, year: query.year, month: query.month }, 'GET /api/payments/reports/collections - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
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
    logger.info({ traceId, count: collections.length, total }, 'GET /api/payments/reports/collections - Success');
    return success(res, { data: collections, meta: buildPagination(total, query.page) });
  },
];
