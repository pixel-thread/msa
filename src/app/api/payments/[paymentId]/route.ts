import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
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
  async (association, { traceId }, request, context) => {
    logger.info("GET /api/payments/[id] - Request started", { traceId });

    const params = await context.params;
    const paymentId = params?.paymentId;

    if (!paymentId) {
      throw new NotFoundError("Payment ID");
    }

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/payments/[id] - User authorized", { traceId, userId: user.id, paymentId });

    const transaction = await getTransactionById(paymentId, association.id);

    if (!transaction) {
      throw new NotFoundError("Transaction");
    }
    
    const adminRoles: UserRole[] = [UserRole.FINANCE, UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.SUPER_ADMIN];
    const isFinance = user.role.some(r => adminRoles.includes(r));
    
    if (!isFinance && transaction.userId !== user.id) {
      throw new ForbiddenError("You do not have permission to view this transaction");
    }

    logger.info("GET /api/payments/[id] - Success", { traceId, paymentId });

    return SuccessResponse({ data: transaction });
  },
);
