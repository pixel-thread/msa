import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '@src/shared/errors';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { UserRole } from '@prisma/client';
import { hasHighRoleAccess } from '@src/shared/utils';

interface SubscribeInput {
  planId: string;
  userId: string;
  associationId: string;
}

interface UpgradeInput {
  planId: string;
  userId: string;
}

interface WaiveInput {
  subscriptionId: string;
  reason: string;
  userId: string;
  associationId: string;
}

export async function subscribe({ planId, userId, associationId }: SubscribeInput) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: {
      id: planId,
      associationId,
      isActive: true,
    },
    include: {
      versions: {
        where: { effectiveTo: null },
        take: 1,
      },
    },
  });

  if (!plan || plan.versions.length === 0) {
    throw new NotFoundError('Plan not found or has no active version');
  }

  const activeVersion = plan.versions[0];

  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existing && existing.status === 'ACTIVE') {
    throw new ConflictError('User already has an active subscription');
  }

  const startDate = new Date();
  const endDate = new Date();
  if (activeVersion.billingCycle === 'YEARLY') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: plan.id,
      planVersionId: activeVersion.id,
      status: 'ACTIVE',
      startDate,
      endDate,
      waivedAt: null,
      waivedReason: null,
      waivedBy: null,
    },
    create: {
      userId,
      planId: plan.id,
      planVersionId: activeVersion.id,
      status: 'ACTIVE',
      startDate,
      endDate,
    },
  });

  await prisma.subscriptionBillingHistory.create({
    data: {
      subscriptionId: subscription.id,
      planVersionId: activeVersion.id,
      amountCharged: activeVersion.amount,
      status: 'PENDING',
      periodStart: startDate,
      periodEnd: endDate,
      dueDate: startDate,
    },
  });

  return subscription;
}

export async function upgradeSubscription({ planId, userId }: UpgradeInput) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
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
      planId,
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

  return updated;
}

export async function waiveSubscription({
  subscriptionId,
  reason,
  userId,
  associationId,
}: WaiveInput) {
  const updated = await prisma.subscription.update({
    where: {
      id: subscriptionId,
      user: {
        associationId,
      },
    },
    data: {
      status: 'WAIVED',
      waivedAt: new Date(),
      waivedReason: reason,
      waivedBy: userId,
    },
  });

  if (!updated) throw new NotFoundError('Subscription not found in this association');

  return updated;
}

export async function getMySubscription(userId: string, page: number) {
  const [subscriptions, total] = await prisma.$transaction([
    prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        planVersion: true,
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.subscription.count({
      where: { userId },
    }),
  ]);

  return {
    data: subscriptions,
    meta: buildPagination(total, page),
  };
}

interface GetSubscriptionPaymentsInput {
  subscriptionId: string;
  userId: string;
  role: UserRole[];
  associationId: string;
  page: number;
}

export async function getSubscriptionPayments({
  subscriptionId,
  userId,
  role,
  associationId,
  page,
}: GetSubscriptionPaymentsInput) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new ForbiddenError('Subscription not found');
  }

  if (subscription.userId !== userId && !hasHighRoleAccess(role)) {
    throw new ForbiddenError('Not authorized to view these payments');
  }

  const [data, total] = await prisma.$transaction([
    prisma.paymentTransaction.findMany({
      where: {
        userId: subscription.userId,
        associationId,
      },
      orderBy: { paymentDate: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.paymentTransaction.count({
      where: {
        userId: subscription.userId,
        associationId,
      },
    }),
  ]);

  return {
    data,
    meta: buildPagination(total, page),
  };
}
