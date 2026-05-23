import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { GetTransactionsQuerySchema } from "@src/features/payments/validators";
import { getAllTransactions } from "@src/features/payments/services/payment.service";

export const GET = withAssociation(
  { query: GetTransactionsQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);
    // Ensure query is at least an empty object if undefined
    const result = await getAllTransactions(
      association.id,
      // eslint-disable-next-line
      (query as any) || {},
    );
    return SuccessResponse({
      data: result.transactions,
      meta: result.pagination,
    });
  },
);
