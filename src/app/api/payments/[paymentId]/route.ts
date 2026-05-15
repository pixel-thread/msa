import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { getTransactionById } from "@feature/payments/services/payment.service";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";

/**
 * GET /api/payments/[id]
 *
 * Retrieve a single transaction with its allocations and metadata.
 *
 * Role: Owner (MEMBER) or FINANCE+
 */
export const GET = withAssociation(
  {},
  async (association, _, request, context) => {
    // Explicitly await params if it's a promise (Next.js 15+ convention)
    const params = await context.params;
    const paymentId = params?.paymentId;

    if (!paymentId) {
      throw new NotFoundError("Payment ID");
    }

    const user = await withRole(request, UserRole.MEMBER);
    const transaction = await getTransactionById(paymentId, association.id);

    if (!transaction) {
      throw new NotFoundError("Transaction");
    }
    
    // Check ownership if not admin/finance
    const adminRoles: UserRole[] = [UserRole.FINANCE, UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN];
    const isFinance = user.role.some(r => adminRoles.includes(r));
    
    if (!isFinance && transaction.userId !== user.id) {
      throw new ForbiddenError("You do not have permission to view this transaction");
    }

    return SuccessResponse({ data: transaction });
  },
);
