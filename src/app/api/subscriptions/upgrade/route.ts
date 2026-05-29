import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { z } from 'zod';
import { NotFoundError, ConflictError, ValidationError } from '@src/shared/errors';
import { logger } from '@src/shared/logger/server';

const UpgradeSchema = z.object({
  planId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpgradeSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/subscriptions/upgrade - Request started',
    );

    const user = await withRole(request, UserRole.MEMBER);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/subscriptions/upgrade - User authorized',
    );

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { planVersion: true },
    });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new ConflictError('Subscription is not active');
    }

    const latestVersion = await prisma.subscriptionPlanVersion.findFirst({
      where: {
        planId: body.planId,
        effectiveTo: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestVersion) {
      throw new NotFoundError('No active version found for this plan');
    }

    if (subscription.planVersionId === latestVersion.id) {
      throw new ConflictError('Already on the latest version');
    }

    const startDate = new Date();
    const endDate = new Date();
    if (latestVersion.billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planVersionId: latestVersion.id,
        startDate,
        endDate,
      },
      include: {
        plan: true,
        planVersion: true,
      },
    });

    await prisma.subscriptionBillingHistory.create({
      data: {
        subscriptionId: subscription.id,
        planVersionId: latestVersion.id,
        amountCharged: latestVersion.amount,
        status: 'PENDING',
        periodStart: startDate,
        periodEnd: endDate,
        dueDate: startDate,
      },
    });

    logger.info(
      {
        traceId,
        subscriptionId: subscription.id,
      },
      'POST /api/subscriptions/upgrade - Success',
    );

    return SuccessResponse({ data: updated });
  },
);
