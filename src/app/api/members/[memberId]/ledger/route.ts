import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@utils/responses";
import { getUserPaymentHistory } from "@feature/payments/services/payment.service";
import { getUserContributionSummary } from "@feature/payments/services/contribution.service";
import z from "zod";

const LedgerRouteParams = z.object({
  memberId: z.uuid(),
});

const LedgerQueryParams = z.object({
  page: z.coerce.number(),
  pageSize: z.coerce.number(),
});

export const GET = withAssociation(
  { params: LedgerRouteParams, query: LedgerQueryParams },
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
