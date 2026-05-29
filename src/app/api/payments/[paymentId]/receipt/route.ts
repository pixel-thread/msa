import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { getTransactionById } from '@feature/payments/services/payment.service';
import { ForbiddenError, NotFoundError } from '@src/shared/errors';

/**
 * GET /api/payments/[id]/receipt
 *
 * Retrieve formatted data for receipt generation.
 *
 * Role: Owner (MEMBER) or FINANCE+
 */
export const GET = withAssociation({}, async (association, { traceId }, request, context) => {
  logger.info({ traceId }, 'GET /api/payments/[id]/receipt - Request started');

  const params = await context.params;
  const paymentId = params?.paymentId;

  if (!paymentId) {
    throw new NotFoundError('Payment ID');
  }

  const user = await withRole(request, UserRole.MEMBER);
  logger.info(
    { traceId, userId: user.id, paymentId },
    'GET /api/payments/[id]/receipt - User authorized',
  );

  const transaction = await getTransactionById(paymentId, association.id);

  if (!transaction) {
    throw new NotFoundError('Transaction');
  }

  const adminRoles: UserRole[] = [
    UserRole.FINANCE,
    UserRole.SECRETARY,
    UserRole.PRESIDENT,
    UserRole.SUPER_ADMIN,
  ];
  const isFinance = user.role.some((r) => adminRoles.includes(r));

  if (!isFinance && transaction.userId !== user.id) {
    throw new ForbiddenError('You do not have permission to view this receipt');
  }

  const receiptData = {
    receiptNumber: transaction.receiptNumber || transaction.id,
    paidAt: transaction.paidAt,
    memberInfo: {
      name: transaction.user.name,
      membershipNumber: transaction.user.membershipNumber,
    },
    associationInfo: { name: association.name },
    amount: transaction.amount,
    method: transaction.method,
    appliedTo: transaction.allocations.map((a) => ({
      year: a.contributionPeriod.year,
      month: a.contributionPeriod.month,
      amount: a.allocatedAmount,
    })),
  };

  logger.info({ traceId, paymentId }, 'GET /api/payments/[id]/receipt - Success');

  return SuccessResponse({ data: receiptData });
});
