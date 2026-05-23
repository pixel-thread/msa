import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { getUserPaymentHistory } from "@feature/payments/services/payment.service";
import { getUserContributionSummary } from "@feature/payments/services/contribution.service";
import { PaymentHistoryQuerySchema } from "@feature/payments/validators";

/**
 * GET /api/payments/history
 *
 * Get the authenticated user's payment history with contribution allocations.
 * Supports pagination via ?page=1&pageSize=20 query params.
 */
export const GET = withAssociation(
  { query: PaymentHistoryQuerySchema },
  async (_association, { query }, request) => {
    const userId = request.headers.get("x-user-id")!;
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;

    const [history, summary] = await Promise.all([
      getUserPaymentHistory(userId, page, pageSize),
      getUserContributionSummary(userId),
    ]);

    return SuccessResponse({
      data: {
        transactions: history.transactions,
        summary,
      },
      meta: history.pagination,
    });
  },
);
