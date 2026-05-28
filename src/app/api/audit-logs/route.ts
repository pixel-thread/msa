import { withAssociation } from "@src/shared/api/with-association";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findAuditLogs,
  getAuditLogStats,
} from "@src/shared/services/audit-logs";
import { SuccessResponse } from "@src/shared/utils";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";
import { withRole } from "@src/shared/api/with-role";
import { logger } from "@src/shared/logger";

const AuditLogQuerySchema = {
  parse: (params: URLSearchParams) => {
    const page = parseInt(params.get("page") || "1", 10);
    const action = params.get("action") || undefined;
    const resourceType = params.get("resourceType") || undefined;
    const actorId = params.get("actorId") || undefined;
    const fromDate = params.get("fromDate")
      ? new Date(params.get("fromDate")!)
      : undefined;
    const toDate = params.get("toDate")
      ? new Date(params.get("toDate")!)
      : undefined;

    return { page, action, resourceType, actorId, fromDate, toDate };
  },
};

export const GET = withAssociation(
  {},
  async (association, { traceId }, request) => {
    logger.info("GET /api/audit-logs - Request started", { traceId, associationId: association.id });
    
    const user = await withRole(request, UserRole.SECRETARY);
    logger.info("GET /api/audit-logs - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!hasHighRoleAccess(user.role)) {
      logger.error("GET /api/audit-logs - Permission denied", { traceId, userId: user.id, roles: user.role });
      throw new ForbiddenError(
        "Permission denied: DPO, PRESIDENT, or SUPER_ADMIN required",
      );
    }

    const { searchParams } = new URL(request.url);
    const query = AuditLogQuerySchema.parse(searchParams);

    const [logsResult, stats] = await Promise.all([
      findAuditLogs(association.id, query),
      getAuditLogStats(association.id),
    ]);

    logger.info("GET /api/audit-logs - Success", { traceId, count: logsResult.logs.length });

    return SuccessResponse({
      data: {
        logs: logsResult.logs,
        stats,
      },
      meta: logsResult.pagination,
    });
  },
);

