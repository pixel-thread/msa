import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getUserPaymentHistory } from '@feature/payments/services/payment.service';
import { withRole } from '@src/shared/utils/with-role';
import { getUserContributionSummary } from '@feature/payments/services/contribution.service';
import { LedgerQueryParams, LedgerRouteParams } from '@src/features/ledger/validators';
import { logger } from '@src/shared/logger';

/** Route handler for retrieving a member's payment ledger and contribution summary. Requires FINANCE role. */
export const getMemberLedger: RequestHandler[] = [
  validate({ params: LedgerRouteParams, query: LedgerQueryParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    const userId = req.userId as string;

    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });

    if (!user || !user.associationId) throw new ForbiddenError('User association not found');

    const association = {
      id: user.association.id,
      slug: user.association.slug,
      name: user.association.name,
    };

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/members/[memberId]/ledger - Request started',
    );

    await withRole(req, UserRole.FINANCE);

    logger.info(
      { traceId, userId: user.id },
      'GET /api/members/[memberId]/ledger - User authorized',
    );

    const query = req.query as { page?: number };
    const page = query?.page ?? 1;

    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page),
      getUserContributionSummary(userId),
    ]);

    logger.info(
      { traceId, count: history.transactions.length },
      'GET /api/members/[memberId]/ledger - Success',
    );

    return success(res, {
      data: { transactions: history.transactions, summary },
      meta: history.pagination,
    });
  },
];
