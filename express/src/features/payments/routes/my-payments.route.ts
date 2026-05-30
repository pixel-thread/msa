import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { PaymentHistoryQuerySchema } from '@src/features/payments/validators';
import { findPaymentTransactions } from '@src/features/payments/services/findPaymentTransactions';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const myPayments: RequestHandler[] = [
  validate({ query: PaymentHistoryQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, query: req.query }, 'GET /api/payments/my - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.MEMBER)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, userId }, 'GET /api/payments/my - User authorized');
    const { page = 1, pageSize = 20 } = (req.query as any) || {};
    const skip = (page - 1) * pageSize;
    const { transactions: payments, total } = await findPaymentTransactions({
      where: { userId, associationId: association.id },
      page,
      pageSize,
    });
    logger.info({ traceId, count: payments.length, total }, 'GET /api/payments/my - Success');
    return success(res, { data: payments, meta: buildPagination(total, page, pageSize) });
  },
];
