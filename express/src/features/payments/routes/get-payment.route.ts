import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { getTransactionById } from '@src/features/payments/services/payment.service';
import { validate } from '@src/shared/lib/validate';
import { z } from 'zod';

const PaymentIdParamSchema = z.object({ paymentId: z.string().uuid() });

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

export const getPayment: RequestHandler[] = [
  validate({ params: PaymentIdParamSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'GET /api/payments/[id] - Request started');
    const association = await getAssociation(req);
    const paymentId = req.params.paymentId;
    if (!paymentId) throw new NotFoundError('Payment ID');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, paymentId },
      'GET /api/payments/[id] - User authorized',
    );
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
