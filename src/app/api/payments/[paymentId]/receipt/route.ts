import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { getTransactionById } from "@feature/payments/services/payment.service";
import { ForbiddenError, NotFoundError } from "@src/shared/errors";

/**
 * GET /api/payments/[id]/receipt
 *
 * Retrieve formatted data for receipt generation.
 *
 * Role: Owner (MEMBER) or FINANCE+
 */
export const GET = withAssociation(
  {},
  async (association, _, request, context) => {
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
    
    const adminRoles: UserRole[] = [UserRole.FINANCE, UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN];
    const isFinance = user.role.some(r => adminRoles.includes(r));
    
    if (!isFinance && transaction.userId !== user.id) {
      throw new ForbiddenError("You do not have permission to view this receipt");
    }

    const receiptData = {
      receiptNumber: transaction.receiptNumber || transaction.id,
      paidAt: transaction.paidAt,
      memberInfo: { 
        name: transaction.user.name, 
        membershipNumber: transaction.user.membershipNumber 
      },
      associationInfo: { name: association.name },
      amount: transaction.amount,
      method: transaction.method,
      appliedTo: transaction.allocations.map(a => ({
        year: a.contributionPeriod.year,
        month: a.contributionPeriod.month,
        amount: a.allocatedAmount
      }))
    };

    return SuccessResponse({ data: receiptData });
  },
);
