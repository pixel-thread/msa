import { Request, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { GetTransactionsQuerySchema } from '@src/features/payments/validators';
import { getAllTransactions } from '@src/features/payments/services/payment.service';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const listPayments = [
  validate({ query: GetTransactionsQuerySchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, query: req.query }, 'GET /api/payments - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'GET /api/payments - User authorized');
    const result = await getAllTransactions(association.id, (req.query as any) || {});
    logger.info({ traceId, count: result.transactions.length }, 'GET /api/payments - Success');
    return success(res, { data: result.transactions, meta: result.pagination });
  },
];
