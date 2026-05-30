// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { prisma } from '@src/shared/lib/prisma';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { Prisma, UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import type { CreateSubscriptionPlanInput } from '@feature/subscriptions/validators';

// ---- Interfaces --------------------------------------------------------------

/** Input for updating a subscription plan. */
interface UpdatePlanInput {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  features?: Record<string, unknown>;
  isActive?: boolean;
  memberTypeId?: string | null;
}

// ---- getPlans ----------------------------------------------------------------

/**
 * Retrieve subscription plans for an association.
 *
 * High-role users see all plans. Regular users are scoped to their
 * member-type; if no plans match, the default plan is returned as fallback.
 */
export async function getPlans(
  associationId: string,
  user: { role: UserRole[]; memberTypeId?: string | null },
) {
  if (hasHighRoleAccess(user.role)) {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { associationId },
      include: {
        versions: {
          where: { effectiveTo: null },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      ...plan,
      activeVersion: plan.versions[0] || null,
      versions: plan.versions,
    }));
  }

  const whereClause: Record<string, unknown> = {
    associationId,
    isActive: true,
  };

  if (user.memberTypeId) {
    whereClause.memberTypeId = user.memberTypeId;
  } else {
    whereClause.memberTypeId = null;
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: whereClause,
    include: {
      versions: {
        take: 1,
        orderBy: { amount: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (plans.length === 0) {
    const defaultPlan = await prisma.subscriptionPlan.findMany({
      where: {
        associationId,
        isDefault: true,
        isActive: true,
      },
      include: {
        versions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const plansWithActiveVersion = defaultPlan.map((plan) => ({
      ...plan,
      activeVersion: plan.versions[0] || null,
      versions: undefined,
    }));

    return plansWithActiveVersion[0] || null;
  }

  const plansWithActiveVersion = plans.map((plan) => ({
    ...plan,
    activeVersion: plan.versions[0] || null,
    versions: undefined,
  }));

  const sortedPlans = user.memberTypeId
    ? plansWithActiveVersion.sort(
        (a, b) => Number(a.activeVersion?.amount ?? 0) - Number(b.activeVersion?.amount ?? 0),
      )
    : plansWithActiveVersion;

  return user.memberTypeId ? sortedPlans[0] : sortedPlans[0] || null;
}

// ---- createPlan --------------------------------------------------------------

/**
 * Create a new subscription plan with an initial version.
 *
 * Validates name-uniqueness within the association, then in a transaction
 * unsets any existing default, creates the plan + first version, and sets
 * the new plan as default.
 */
export async function createPlan(associationId: string, body: CreateSubscriptionPlanInput) {
  const isPlanExistWithSameName = await prisma.subscriptionPlan.findFirst({
    where: {
      name: body.name,
      associationId,
    },
  });

  if (isPlanExistWithSameName) throw new BadRequestError('Plan with same name already exist');

  const plan = await prisma.$transaction(async (tx) => {
    await tx.subscriptionPlan.updateMany({
      where: { associationId },
      data: { isDefault: false },
    });

    return tx.subscriptionPlan.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        isDefault: true,
        memberTypeId: body.memberTypeId,
        associationId,
        versions: {
          create: {
            amount: body.amount,
            currency: body.currency,
            billingCycle: body.billingCycle,
            features: body.features,
            effectiveFrom: body.effectiveFrom,
            effectiveTo: body.effectiveTo,
            description: body.description,
          },
        },
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
    });
  });

  return plan;
}

// ---- setDefaultPlan ----------------------------------------------------------

/**
 * Set a plan as the default for an association.
 *
 * Ensures the plan exists within the association, then atomically clears
 * the existing default and sets the target plan as the new default.
 */
export async function setDefaultPlan(associationId: string, planId: string) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, associationId },
  });

  if (!plan) {
    throw new NotFoundError('Plan not found in this association');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.subscriptionPlan.updateMany({
      where: { associationId },
      data: { isDefault: false },
    });

    return tx.subscriptionPlan.update({
      where: { id: planId },
      data: { isDefault: true },
    });
  });

  return updated;
}

// ---- updatePlan --------------------------------------------------------------

/**
 * Update a subscription plan, creating a new version if price fields change.
 *
 * Price-related fields (amount, currency, billingCycle, features) trigger
 * a new version rather than mutating the existing one, preserving billing
 * history. Non-price metadata is updated in-place on the plan record.
 */
export async function updatePlan(associationId: string, planId: string, body: UpdatePlanInput) {
  const priceFields = ['amount', 'currency', 'billingCycle', 'features'] as const;
  const hasPriceChange = priceFields.some((field) => body[field] !== undefined);

  if (hasPriceChange) {
    const currentVersion = await prisma.subscriptionPlanVersion.findFirst({
      where: { planId, effectiveTo: null },
    });

    if (!currentVersion) {
      throw new NotFoundError('No active version found for this plan');
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlanVersion.update({
        where: { id: currentVersion.id },
        data: { effectiveTo: new Date() },
      });

      const newVersion = await tx.subscriptionPlanVersion.create({
        data: {
          planId,
          amount: body.amount ?? currentVersion.amount,
          currency: body.currency ?? currentVersion.currency,
          billingCycle: body.billingCycle ?? currentVersion.billingCycle,
          features: (body.features as Prisma.InputJsonValue) ?? currentVersion.features,
          description: body.description ?? currentVersion.description,
        },
      });

      const plan = await tx.subscriptionPlan.update({
        where: { id: planId, associationId },
        data: {
          name: body.name,
          description: body.description,
          isActive: body.isActive,
          memberTypeId: body.memberTypeId,
        },
      });

      return { ...plan, activeVersion: newVersion };
    });

    return updatedPlan;
  }

  const { amount, currency, billingCycle, features, ...metadata } = body;
  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId, associationId },
    data: metadata,
  });

  return plan;
}

// ---- softDeletePlan ----------------------------------------------------------

/**
 * Soft-delete a plan by setting it as inactive.
 *
 * This preserves the plan record and associated data while removing it
 * from active use.
 */
export async function softDeletePlan(associationId: string, planId: string) {
  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId, associationId },
    data: { isActive: false },
  });

  return plan;
}
