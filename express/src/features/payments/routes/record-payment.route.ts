import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { RecordManualPaymentSchema } from '@src/features/payments/validators';
import { recordManualPayment } from '@src/features/payments/services/payment.service';

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

export const recordPayment: RequestHandler[] = [
  validate({ body: RecordManualPaymentSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, userId: req.body.userId },
      'POST /api/payments/record - Request started',
    );
    const association = await getAssociation(req);
    const userId = req.userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/record - User authorized');
    logger.info(
      { traceId, targetUserId: req.body.userId, amount: req.body.amount },
      'POST /api/payments/record - Recording manual payment',
    );
    const transaction = await recordManualPayment({
      associationId: association.id,
      userId: req.body.userId,
      amount: req.body.amount,
      method: req.body.method,
      notes: req.body.notes,
      receiptNumber: req.body.receiptNumber,
      referenceNumber: req.body.referenceNumber,
      createdById: user.id,
    });
    logger.info({ traceId, transactionId: transaction.id }, 'POST /api/payments/record - Success');
    return success(
      res,
      { data: transaction, message: 'Payment recorded and allocated successfully' },
      201,
    );
  },
];
