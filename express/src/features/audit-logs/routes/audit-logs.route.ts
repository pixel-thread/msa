import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findAuditLogs, getAuditLogStats } from '@src/features/audit-logs/services';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';
import { logger } from '@src/shared/logger';

export const getAuditLogs: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/audit-logs - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/audit-logs - User authorized',
    );
    if (!hasHighRoleAccess(user.role)) {
      logger.error(
        { traceId, userId: user.id, roles: user.role },
        'GET /api/audit-logs - Permission denied',
      );
      throw new ForbiddenError('Permission denied: DPO, PRESIDENT, or SUPER_ADMIN required');
    }
    const page = parseInt(req.query.page as string, 10) || 1;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;
    const actorId = req.query.actorId as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    const query = { page, action, resourceType, actorId, fromDate, toDate, limit: 10 };
    const [logsResult, stats] = await Promise.all([
      findAuditLogs(association.id, query as any),
      getAuditLogStats(association.id),
    ]);
    logger.info({ traceId, count: logsResult.logs.length }, 'GET /api/audit-logs - Success');
    return success(res, { data: { logs: logsResult.logs, stats }, meta: logsResult.pagination });
  },
];
