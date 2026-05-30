// ---------------------------------------------------------------------------
// ENDPOINT:  POST /api/payments/order
// SECURITY:  Requires MEMBER role
// PURPOSE:   Create a Razorpay order for the authenticated member.
//            Determines the amount based on the member's subscription plan
//            (or the default plan if no member-specific plan exists).
//            Falls back to the default plan if no member-type plan is found.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { CreateOrderSchema } from '@src/features/payments/validators';
import { createPaymentOrder } from '@src/features/payments/services/payment.service';
import { findSubscriptionPlans } from '@src/features/payments/services/findSubscriptionPlans';
import { getActiveProvider } from '@src/features/payments/services/payment-provider.service';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Helpers ----

/**
 * Resolve the authenticated user's association for multi-tenant scoping.
 */
async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

// ---- Handler ----

export const createOrder: RequestHandler[] = [
  // Step 1: Validate request body
  validate({ body: CreateOrderSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId }, 'POST /api/payments/order - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce MEMBER role & get user info ---
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/order - User authorized');

    // --- Business logic: determine the correct subscription plan ---
    // Step A: Check if the association has an active payment provider
    const associationActivePaymentProvider = await getActiveProvider(association.id);
    if (!associationActivePaymentProvider) {
      throw new NotFoundError('No payment provider set up for this association.');
    }

    // Step B: Find the subscription plan matching the member's type
    const typeId = user?.memberTypeId;
    const whereClause: Record<string, unknown> = { associationId: association.id, isActive: true };
    if (typeId) {
      whereClause.memberTypeId = typeId;
    } else {
      // Members without a type get plans with null memberTypeId (general plans)
      whereClause.memberTypeId = null;
    }
    const plansInclude = {
      versions: { take: 1, orderBy: { createdAt: 'desc' as const } },
    };

    let plansRaw = await findSubscriptionPlans({
      where: whereClause as Parameters<typeof findSubscriptionPlans>[0]['where'],
      include: plansInclude,
    });
    let plans = plansRaw as unknown as ((typeof plansRaw)[number] & {
      versions: Array<{ amount: number }>;
    })[];

    // Step C: Fallback to default plan if no member-type-specific plan exists
    if (plans.length === 0) {
      plansRaw = await findSubscriptionPlans({
        where: { associationId: association.id, isDefault: true, isActive: true },
        include: plansInclude,
      });
      plans = plansRaw as unknown as typeof plans;
    }

    if (plans.length === 0 || !plans[0].versions[0]) {
      throw new NotFoundError('Plan not found under this member Group');
    }

    // Step D: For member-type plans, pick the cheapest (first after sorting asc)
    const selectedPlan = typeId
      ? plans.sort(
          (a, b) => Number(a.versions[0]?.amount ?? 0) - Number(b.versions[0]?.amount ?? 0),
        )[0]
      : plans[0];
    const activeVersion = selectedPlan.versions[0];

    // Step E: Create Razorpay order and payment transaction
    logger.info(
      { traceId, userId: user.id, amount: parseInt(activeVersion.amount.toFixed(2)) },
      'POST /api/payments/order - Creating payment order',
    );
    const orderDetails = await createPaymentOrder({
      associationId: association.id,
      userId: user.id,
      amount: parseInt(activeVersion.amount.toFixed(2)),
      notes: req.body?.notes,
    });

    // --- Log: success ---
    logger.info(
      { traceId, orderId: (orderDetails as any).id },
      'POST /api/payments/order - Success',
    );

    // --- Response ---
    return success(res, { data: orderDetails }, 201);
  }),
];
