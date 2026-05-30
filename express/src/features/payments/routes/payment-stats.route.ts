import { Request, NextFunction, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getFinancialStats } from '@src/features/payments/services/payment.service';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const paymentStats = [
  async (req: Request, res: Response, _next?: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'GET /api/payments/stats - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.FINANCE)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'GET /api/payments/stats - User authorized');
    const data = await getFinancialStats(association.id);
    logger.info({ traceId }, 'GET /api/payments/stats - Success');
    return success(res, { data: data.stats, meta: data.pagination });
  },
];
