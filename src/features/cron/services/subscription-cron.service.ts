import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction } from '@prisma/client';
import { logAction } from '@src/shared/services/audit-logs';

export interface SubscriptionExpiryResult {
  associationId: string;
  associationSlug: string;
  expired: number;
  failed: number;
  error?: string;
}

export async function expireOverdueSubscriptions(
  associationId: string,
): Promise<SubscriptionExpiryResult> {
  try {
    const now = new Date();

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

    await prisma.subscription.updateMany({
      where: {
        id: { in: expiredSubscriptions.map((s) => s.id) },
      },
      data: {
        status: 'EXPIRED',
      },
    });

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
