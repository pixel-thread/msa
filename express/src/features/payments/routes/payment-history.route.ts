import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { PaymentHistoryQuerySchema } from '@src/features/payments/validators';
import { getUserPaymentHistory } from '@src/features/payments/services/payment.service';
import { getUserContributionSummary } from '@src/features/payments/services/contribution.service';

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

export const paymentHistory: RequestHandler[] = [
  validate({ query: PaymentHistoryQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId, query: req.query }, 'GET /api/payments/history - Request started');
    await getAssociation(req);
    const userId = req.userId as string;
    const page = (req.query as any)?.page ?? 1;
    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page),
      getUserContributionSummary(userId),
    ]);
    logger.info(
      { traceId, count: history.transactions.length },
      'GET /api/payments/history - Success',
    );
    return success(res, {
      data: { transactions: history.transactions, summary },
      meta: history.pagination,
    });
  },
];
