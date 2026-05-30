import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import {
  UserPaymentsParamsSchema,
  UserContributionsParamsSchema,
} from '@src/features/payments/validators';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { getUserContributionSummary } from '@src/features/payments/services/contribution.service';
import { findPaymentTransactions } from '@src/features/payments/services/findPaymentTransactions';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { pageNumberValidation } from '@src/shared/validators/common';
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

const UserPaymentsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const userPayments: RequestHandler[] = [
  validate({ params: UserPaymentsParamsSchema, query: UserPaymentsQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, userId: req.params.userId },
      'GET /api/payments/users/[userId] - Request started',
    );
    const association = await getAssociation(req);
    const authUserId = req.userId as string;
    const authUser = await prisma.user.findUnique({
      where: { id: authUserId },
      select: { role: true },
    });
    if (!authUser || !authUser.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'GET /api/payments/users/[userId] - User authorized');
    const { userId } = req.params as { userId: string };
    const page = (req.query as any)?.page || 1;
    const user = await findFirstMember({ where: { id: userId, associationId: association.id } });
    if (!user) throw new NotFoundError('User not found in this association');
    logger.info({ traceId, userId }, 'GET /api/payments/users/[userId] - Fetching transactions');
    const { transactions, total } = await findPaymentTransactions({
      where: { userId, associationId: association.id },
      page,
      pageSize: 10,
      include: {
        allocations: {
          include: {
            contributionPeriod: {
              select: { year: true, month: true, expectedAmount: true, status: true },
            },
          },
        },
      },
    });
    const summary = await getUserContributionSummary(userId);
    logger.info(
      { traceId, userId, count: transactions.length, total },
      'GET /api/payments/users/[userId] - Success',
    );
    return success(res, {
      data: { user, transactions, summary },
      meta: buildPagination(total, page),
    });
  }),
];

const UserContributionsQuerySchema = z.object({
  page: pageNumberValidation,
  fromYear: z.coerce.number().int().min(2020).max(2100).optional(),
  fromMonth: z.coerce.number().int().min(1).max(12).optional(),
  toYear: z.coerce.number().int().min(2020).max(2100).optional(),
  toMonth: z.coerce.number().int().min(1).max(12).optional(),
});

export const userContributions: RequestHandler[] = [
  validate({ params: UserContributionsParamsSchema, query: UserContributionsQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, userId: req.params.userId },
      'GET /api/payments/users/[userId]/contributions - Request started',
    );
    const association = await getAssociation(req);
    const authUserId = req.userId as string;
    const authUser = await prisma.user.findUnique({
      where: { id: authUserId },
      select: { role: true },
    });
    if (!authUser || !authUser.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'GET /api/payments/users/[userId]/contributions - User authorized');
    const { userId } = req.params as { userId: string };
    const {
      page = 1,
      fromYear,
      fromMonth,
      toYear,
      toMonth,
    } = (req.query as {
      page?: number;
      fromYear?: number;
      fromMonth?: number;
      toYear?: number;
      toMonth?: number;
    }) || {};
    const user = await findFirstMember({ where: { id: userId, associationId: association.id } });
    if (!user) throw new NotFoundError('User not found in this association');
    const whereClause: Record<string, unknown> = { userId, associationId: association.id };
    if (fromYear && fromMonth) {
      whereClause.AND = [
        { OR: [{ year: { gt: fromYear } }, { year: fromYear, month: { gte: fromMonth } }] },
      ];
    }
    if (toYear && toMonth) {
      const toClause = {
        OR: [{ year: { lt: toYear } }, { year: toYear, month: { lte: toMonth } }],
      };
      whereClause.AND = whereClause.AND
        ? [...(whereClause.AND as unknown[]), toClause]
        : [toClause];
    }
    logger.info(
      { traceId, userId },
      'GET /api/payments/users/[userId]/contributions - Fetching contributions',
    );
    const { contributions, total } = await findContributionPeriods({
      where: whereClause as Parameters<typeof findContributionPeriods>[0]['where'],
      page,
      pageSize: PAGE_SIZE,
      include: {
        allocations: {
          include: {
            paymentTransaction: {
              select: {
                id: true,
                amount: true,
                method: true,
                gateway: true,
                status: true,
                paidAt: true,
                receiptNumber: true,
              },
            },
          },
        },
      },
    });
    const summary = await getUserContributionSummary(userId);
    logger.info(
      { traceId, userId, count: contributions.length, total },
      'GET /api/payments/users/[userId]/contributions - Success',
    );
    return success(res, {
      data: { user, contributions, summary },
      meta: buildPagination(total, page),
    });
  }),
];
