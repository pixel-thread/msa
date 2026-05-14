import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { GetTransactionsQuerySchema } from "@src/features/payments/validators";
import { getAllTransactions } from "@src/features/payments/services/payment.service";

export const GET = withAssociation(
  { query: GetTransactionsQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);
    const result = await getAllTransactions(association.id, query);
    return SuccessResponse({
      data: result.transactions,
      meta: result.pagination,
    });
  },
);
