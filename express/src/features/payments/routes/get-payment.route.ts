import { Request, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getTransactionById } from '@src/features/payments/services/payment.service';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const getPayment = [
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'GET /api/payments/[id] - Request started');
    const association = await getAssociation(req);
    const paymentId = req.params.paymentId;
    if (!paymentId) throw new NotFoundError('Payment ID');
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user || !user.role.includes(UserRole.MEMBER)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, userId: user.id, paymentId }, 'GET /api/payments/[id] - User authorized');
    const transaction = await getTransactionById(paymentId, association.id);
    if (!transaction) throw new NotFoundError('Transaction');
    const adminRoles: UserRole[] = [
      UserRole.FINANCE,
      UserRole.SECRETARY,
      UserRole.PRESIDENT,
      UserRole.SUPER_ADMIN,
    ];
    const isFinance = user.role.some((r) => adminRoles.includes(r));
    if (!isFinance && transaction.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to view this transaction');
    }
    logger.info({ traceId, paymentId }, 'GET /api/payments/[id] - Success');
    return success(res, { data: transaction });
  },
];
