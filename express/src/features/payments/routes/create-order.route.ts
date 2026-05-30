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

export const createOrder: RequestHandler[] = [
  validate({ body: CreateOrderSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/payments/order - Request started');
    const association = await getAssociation(req);
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'POST /api/payments/order - User authorized');
    const typeId = user?.memberTypeId;
    const associationActivePaymentProvider = await getActiveProvider(association.id);
    if (!associationActivePaymentProvider) {
      throw new NotFoundError('No payment provider set up for this association.');
    }
    const whereClause: Record<string, unknown> = { associationId: association.id, isActive: true };
    if (typeId) {
      whereClause.memberTypeId = typeId;
    } else {
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
    const selectedPlan = typeId
      ? plans.sort(
          (a, b) => Number(a.versions[0]?.amount ?? 0) - Number(b.versions[0]?.amount ?? 0),
        )[0]
      : plans[0];
    const activeVersion = selectedPlan.versions[0];
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
    logger.info(
      { traceId, orderId: (orderDetails as any).id },
      'POST /api/payments/order - Success',
    );
    return success(res, { data: orderDetails }, 201);
  },
];
