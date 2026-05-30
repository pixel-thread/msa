// ---- GET /api/audit-logs
// ---- Description: Retrieve paginated audit logs with optional filters and stats.
// ---- Security: Requires SECRETARY role or higher (DPO, PRESIDENT, SUPER_ADMIN)

// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// Shared utilities
import { success } from '@src/shared/utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// Prisma
import { UserRole } from '@prisma/client';

// Services
import { findAuditLogs, getAuditLogStats } from '@src/features/audit-logs/services';

export const getAuditLogs: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Extract tracing context

    const traceId = (req.traceId as string) || '';

    // ---- Auth: verify association membership

    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/audit-logs - Request started',
    );

    // ---- Auth: verify user has at least SECRETARY role

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/audit-logs - User authorized',
    );

    // ---- Auth: only DPO, PRESIDENT, or SUPER_ADMIN may view audit logs
    // The SECRETARY role can pass withRole but is excluded here via high-role check.

    if (!hasHighRoleAccess(user.role)) {
      logger.error(
        { traceId, userId: user.id, roles: user.role },
        'GET /api/audit-logs - Permission denied',
      );
      throw new ForbiddenError('Permission denied: DPO, PRESIDENT, or SUPER_ADMIN required');
    }

    // ---- Parse query parameters

    const page = parseInt(req.query.page as string, 10) || 1;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;
    const actorId = req.query.actorId as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    const query = { page, action, resourceType, actorId, fromDate, toDate, limit: 10 };

    // ---- Fetch audit logs and stats concurrently
    // TODO: wire up actual typed service call (currently uses `as any` cast)

    const [logsResult, stats] = await Promise.all([
      findAuditLogs(association.id, query as any),
      getAuditLogStats(association.id),
    ]);

    // ---- Log success and return response

    logger.info({ traceId, count: logsResult.logs.length }, 'GET /api/audit-logs - Success');
    return success(res, { data: { logs: logsResult.logs, stats }, meta: logsResult.pagination });
  }),
];
