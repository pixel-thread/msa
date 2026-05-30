import { Request, NextFunction, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@src/shared/errors';
import { UserRole, ContributionStatus } from '@prisma/client';
import { z } from 'zod';
import { GenerateContributionsSchema, WaiveContributionSchema } from '@src/features/payments/validators';
import {
  generateMonthlyContributions,
  markOverdueContributions,
  waiveContribution,
} from '@src/features/payments/services/contribution.service';
import { findContributionPeriods } from '@src/features/payments/services/findContributionPeriods';
import { findUniqueContributionPeriod } from '@src/features/payments/services/findUniqueContributionPeriod';
import { pageNumberValidation } from '@src/shared/validators/common';
import { PAGE_SIZE } from '@src/shared/constants';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

const ContributionsQuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(Object.values(ContributionStatus) as [string, ...string[]]).optional(),
  userId: z.uuid().optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

const ContributionIdParamsSchema = z.object({
  contributionId: z.string().uuid('Invalid contribution ID'),
});

export const listContributions = [
  validate({ query: ContributionsQuerySchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, query: req.query }, 'GET /api/payments/contributions - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'GET /api/payments/contributions - User authorized');
    const page = (req.query as any)?.page || 1;
    const { status, userId: filterUserId, year, month } = (req.query as {
      page: number; status?: ContributionStatus; userId?: string; year?: number; month?: number;
    });
    const where: Record<string, unknown> = { associationId: association.id };
    if (status) where.status = status;
    if (filterUserId) where.userId = filterUserId;
    if (year) where.year = year;
    if (month) where.month = month;
    const { contributions, total } = await findContributionPeriods({
      where: where as Parameters<typeof findContributionPeriods>[0]['where'],
      page,
      pageSize: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true, membershipNumber: true } },
        allocations: {
          include: {
            paymentTransaction: { select: { id: true, amount: true, method: true, status: true, paidAt: true, receiptNumber: true } },
          },
        },
      },
    });
    logger.info({ traceId, count: contributions.length }, 'GET /api/payments/contributions - Success');
    return success(res, { data: contributions, meta: buildPagination(total, page) });
  },
];

export const generateContributions = [
  validate({ body: GenerateContributionsSchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, year: req.body.year, month: req.body.month }, 'POST /api/payments/contributions - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'POST /api/payments/contributions - User authorized');
    logger.info({ traceId, year: req.body.year, month: req.body.month }, 'POST /api/payments/contributions - Generating contributions');
    const count = await generateMonthlyContributions(association.id, req.body.year, req.body.month);
    const overdueCount = await markOverdueContributions(association.id);
    logger.info({ traceId, generated: count, markedOverdue: overdueCount }, 'POST /api/payments/contributions - Success');
    return success(res, {
      data: { generated: count, markedOverdue: overdueCount },
      message: `Generated ${count} contribution records, marked ${overdueCount} as overdue`,
    }, 201);
  },
];

export const waiveContributionHandler = [
  validate({ body: WaiveContributionSchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, contributionPeriodId: req.body.contributionPeriodId }, 'PATCH /api/payments/contributions - Request started');
    await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'PATCH /api/payments/contributions - User authorized');
    const waived = await waiveContribution(req.body.contributionPeriodId, req.body.reason);
    logger.info({ traceId, contributionPeriodId: req.body.contributionPeriodId }, 'PATCH /api/payments/contributions - Success');
    return success(res, { data: waived, message: 'Contribution period waived successfully' }, 200);
  },
];

export const getContribution = [
  validate({ params: ContributionIdParamsSchema }),
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, contributionId: req.params.contributionId }, 'GET /api/payments/contributions/[contributionId] - Request started');
    const association = await getAssociation(req);
    const contribution = await findUniqueContributionPeriod({
      where: { id: req.params.contributionId, associationId: association.id },
      include: {
        user: { select: { id: true, name: true, email: true, membershipNumber: true } },
        allocations: {
          include: {
            paymentTransaction: { select: { id: true, amount: true, method: true, status: true, paidAt: true, receiptNumber: true } },
          },
        },
      },
    });
    if (!contribution) throw new NotFoundError('Contribution not found');
    logger.info({ traceId, contributionId: req.params.contributionId }, 'GET /api/payments/contributions/[contributionId] - Success');
    return success(res, { data: contribution });
  },
];
