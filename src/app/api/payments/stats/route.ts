import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { getFinancialStats } from "@feature/payments/services/payment.service";

/**
 * GET /api/payments/stats
 *
 * Summary statistics for the association's financial health.
 *
 * Role: FINANCE+
 */
export const GET = withAssociation(
  {},
  async (association, _, request) => {
    await withRole(request, UserRole.FINANCE);
    const stats = await getFinancialStats(association.id);
    return SuccessResponse({ data: stats });
  },
);
