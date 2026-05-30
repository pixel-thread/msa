import { Request, NextFunction, Response } from 'express';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import { getDsarSlaStatus } from '@src/features/dsar/services';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { logger } from '@src/shared/logger';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0, PRESIDENT: 1, SECRETARY: 2, FINANCE: 3, DPO: 4, MEMBER: 5,
};

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

async function withRole(req: Request, role: UserRole) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await getUniqueUser({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('Unauthorized');
  const roles = user.role as UserRole[];
  const highestUserRole = roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] < ROLE_HIERARCHY[highest] ? current : highest,
  );
  const hasPermission = ROLE_HIERARCHY[highestUserRole] <= ROLE_HIERARCHY[role];
  if (!hasPermission) throw new ForbiddenError('Permission denied');
  return { ...user, role: roles };
}

export const getSlaReport = async (req: Request, res: Response, _next?: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const association = await getAssociation(req);
  logger.info({ traceId, associationId: association.id }, 'GET /api/dsar/sla-report - Request started');

  await withRole(req, UserRole.DPO);

  const report = await getDsarSlaStatus(association.id);

  logger.info({ traceId }, 'GET /api/dsar/sla-report - Success');
  return success(res, { data: report, message: '' });
};
