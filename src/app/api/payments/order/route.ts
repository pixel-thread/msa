import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';
import { CreateOrderSchema } from '@feature/payments/validators';
import { createPaymentOrder } from '@feature/payments/services/payment.service';
import { findSubscriptionPlans } from '@src/features/payments/services/findSubscriptionPlans';
import { NotFoundError } from '@src/shared/errors';
import { getActiveProvider } from '@src/features/payments/services/payment-provider.service';

/**
 * POST /api/payments/order
 *
 * Create a Razorpay order for a user's payment.
 * Returns the order details needed to open Razorpay Checkout on the frontend.
 *
 * Requires: MEMBER role or higher.
 */
export const POST = withAssociation(
  { body: CreateOrderSchema },
  async (association, { body, traceId }, request) => {
    logger.info({ traceId }, 'POST /api/payments/order - Request started');

    const user = await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/order - User authorized');
    const typeId = user?.memberTypeId;

    const associationActivePaymentProvider = getActiveProvider(association.id);

    if (!associationActivePaymentProvider)
      throw new NotFoundError('No payment provider set up for this association.');

    const whereClause: Record<string, unknown> = {
      associationId: association.id,
      isActive: true,
    };

    if (typeId) {
      whereClause.memberTypeId = typeId;
    } else {
      whereClause.memberTypeId = null;
    }

    const plansInclude = {
      versions: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
      },
    };

    let plansRaw = await findSubscriptionPlans({
      where: whereClause as Parameters<typeof findSubscriptionPlans>[0]['where'],
      include: plansInclude,
    });

    let plans = plansRaw as unknown as (typeof plansRaw[number] & { versions: Array<{ amount: number }> })[];

    if (plans.length === 0) {
      plansRaw = await findSubscriptionPlans({
        where: {
          associationId: association.id,
          isDefault: true,
          isActive: true,
        },
        include: plansInclude,
      });
      plans = plansRaw as unknown as typeof plans;
    }

    if (plans.length === 0 || !plans[0].versions[0]) {
      throw new NotFoundError('Plan not found under this member Group');
    }

    const selectedPlan = typeId
      ? plans.sort(
          (a, b) => Number(a.versions[0]?.amount ?? 0) - Number(b.versions[0]?.amount ?? 0),
        )[0]
      : plans[0];

    const activeVersion = selectedPlan.versions[0];

    logger.info(
      {
        traceId,
        userId: user.id,
        amount: parseInt(activeVersion.amount.toFixed(2)),
      },
      'POST /api/payments/order - Creating payment order',
    );

    const orderDetails = await createPaymentOrder({
      associationId: association.id,
      userId: user?.id,
      amount: parseInt(activeVersion.amount.toFixed(2)),
      notes: body!.notes,
    });

    logger.info(
      { traceId, orderId: (orderDetails as any).id },
      'POST /api/payments/order - Success',
    );

    return SuccessResponse({ data: orderDetails }, 201);
  },
);
