import { withAssociation } from '@src/shared/api/with-association';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findAuditLogs, getAuditLogStats } from '@src/shared/services/audit-logs';
import { SuccessResponse } from '@src/shared/utils';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { withRole } from '@src/shared/api/with-role';
import { logger } from '@src/shared/logger/server';

const AuditLogQuerySchema = {
  parse: (params: URLSearchParams) => {
    const page = parseInt(params.get('page') || '1', 10);
    const action = params.get('action') || undefined;
    const resourceType = params.get('resourceType') || undefined;
    const actorId = params.get('actorId') || undefined;
    const fromDate = params.get('fromDate') ? new Date(params.get('fromDate')!) : undefined;
    const toDate = params.get('toDate') ? new Date(params.get('toDate')!) : undefined;

    return { page, action, resourceType, actorId, fromDate, toDate };
  },
};

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info({ traceId, associationId: association.id }, 'GET /api/audit-logs - Request started');

  const user = await withRole(request, UserRole.SECRETARY);
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

  const { searchParams } = new URL(request.url);
  const query = AuditLogQuerySchema.parse(searchParams);

  const [logsResult, stats] = await Promise.all([
    findAuditLogs(association.id, query),
    getAuditLogStats(association.id),
  ]);

  logger.info({ traceId, count: logsResult.logs.length }, 'GET /api/audit-logs - Success');

  return SuccessResponse({
    data: {
      logs: logsResult.logs,
      stats,
    },
    meta: logsResult.pagination,
  });
});
