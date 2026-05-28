import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { UserRole } from "@prisma/client";
import { getFinancialStats } from "@feature/payments/services/payment.service";

/**
 * GET /api/payments/stats
 *
 * Summary statistics for the association's financial health.
 *
 * Role: FINANCE+
 */
export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info("GET /api/payments/stats - Request started", { traceId });

  await withRole(request, UserRole.FINANCE);
  logger.info("GET /api/payments/stats - User authorized", { traceId });

  const data = await getFinancialStats(association.id);

  logger.info("GET /api/payments/stats - Success", { traceId });

  return SuccessResponse({ data: data.stats, meta: data.pagination });
});
