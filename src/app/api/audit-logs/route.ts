import { withAssociation } from "@src/shared/api/with-association";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findAuditLogs,
  getAuditLogStats,
} from "@src/shared/services/audit-logs";
import { SuccessResponse } from "@src/shared/utils";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { withRole } from "@src/shared/api/with-role";

const AuditLogQuerySchema = {
  parse: (params: URLSearchParams) => {
    const page = parseInt(params.get("page") || "1", 10);
    const limit = Math.min(parseInt(params.get("limit") || "50", 10), 100);
    const action = params.get("action") || undefined;
    const resourceType = params.get("resourceType") || undefined;
    const actorId = params.get("actorId") || undefined;
    const fromDate = params.get("fromDate")
      ? new Date(params.get("fromDate")!)
      : undefined;
    const toDate = params.get("toDate")
      ? new Date(params.get("toDate")!)
      : undefined;

    return { page, limit, action, resourceType, actorId, fromDate, toDate };
  },
};

export const GET = withAssociation(
  {},
  async (association, _validated, request) => {
    const user = await withRole(request, UserRole.SECRETARY);

    if (!hasHighRoleAccess(user.role)) {
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

    return SuccessResponse({
      data: {
        logs: logsResult.logs,
        stats,
      },
      meta: logsResult.pagination,
    });
  },
);

