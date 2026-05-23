import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { getUserPaymentHistory } from "@feature/payments/services/payment.service";
import { getUserContributionSummary } from "@feature/payments/services/contribution.service";
import { UserRole } from "@prisma/client";
import {
  LedgerQueryParams,
  LedgerRouteParams,
} from "@src/features/ledger/validators";

export const GET = withAssociation(
  { params: LedgerRouteParams, query: LedgerQueryParams },
  async (_association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);

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
