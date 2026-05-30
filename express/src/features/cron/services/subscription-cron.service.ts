import { AuditAction } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';
import { logAction } from '@src/shared/services/audit-logs';

// ---- Interfaces -------------------------------------------------------------

/** Result of processing expired subscriptions for a single association. */
export interface SubscriptionExpiryResult {
  associationId: string;
  associationSlug: string;
  expired: number;
  failed: number;
  error?: string;
}

// ---- Service: Individual Association ----------------------------------------

/**
 * Expire overdue subscriptions for a given association.
 * Finds active subscriptions past their end date (up to 100), marks them as EXPIRED,
 * and logs an audit action. Returns a summary result for the association.
 */
export async function expireOverdueSubscriptions(
  associationId: string,
): Promise<SubscriptionExpiryResult> {
  try {
    const now = new Date();

    // ----- Validate association exists
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { slug: true },
    });

    if (!association) {
      return {
        associationId,
        associationSlug: 'unknown',
        expired: 0,
        failed: 0,
        error: 'Association not found',
      };
    }

    // ----- Find overdue subscriptions
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        user: { associationId },
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      select: { id: true, userId: true, planVersionId: true },
      take: 100,
    });

    if (expiredSubscriptions.length === 0) {
      return {
        associationId,
        associationSlug: association.slug,
        expired: 0,
        failed: 0,
      };
    }

    // ----- Bulk-expire subscriptions
    await prisma.subscription.updateMany({
      where: {
        id: { in: expiredSubscriptions.map((s) => s.id) },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // ----- Audit log
    await logAction({
      associationId,
      actorId: '',
      action: AuditAction.SUBSCRIPTION_CHANGE,
      resourceType: 'SUBSCRIPTION_OVERDUE',
    });

    return {
      associationId,
      associationSlug: association.slug,
      expired: expiredSubscriptions.length,
      failed: 0,
    };
  } catch (error) {
    return {
      associationId,
      associationSlug: 'unknown',
      expired: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ---- Service: All Associations ----------------------------------------------

/**
 * Run subscription expiry check for all active associations.
 * Processes every active association concurrently and returns their results.
 */
export async function runSubscriptionExpiryCron(): Promise<SubscriptionExpiryResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(
    associations.map((assoc) => expireOverdueSubscriptions(assoc.id)),
  );

  return results;
}
