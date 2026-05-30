import { UserStatus, AuditAction } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';
import { logAction } from '@src/shared/services/audit-logs';

// ---- Interfaces -------------------------------------------------------------

/** Result of anonymizing expired users for a single association. */
export interface AnonymizeResult {
  associationId: string;
  associationSlug: string;
  processed: number;
  failed: number;
  error?: string;
}

// ---- Service: Individual Association ----------------------------------------

/**
 * Anonymize users whose data retention period has expired for a given association.
 * Fetches up to 100 expired users, overwrites personal fields, marks as ANONYMIZED,
 * and logs the audit action. Returns a summary result for the association.
 */
export async function anonymizeExpiredUsers(associationId: string): Promise<AnonymizeResult> {
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
        processed: 0,
        failed: 0,
        error: 'Association not found',
      };
    }

    // ----- Find users past their data retention period
    const expiredUsers = await prisma.user.findMany({
      where: {
        associationId,
        dataRetentionUntil: { lte: now },
        status: { not: UserStatus.ANONYMIZED },
      },
      select: { id: true, email: true },
      take: 100,
    });

    if (expiredUsers.length === 0) {
      return {
        associationId,
        associationSlug: association.slug,
        processed: 0,
        failed: 0,
      };
    }

    // ----- Anonymize each user in a transaction
    const userIds = expiredUsers.map((u) => u.id);

    await prisma.$transaction(
      userIds.map((userId) =>
        prisma.user.update({
          where: { id: userId },
          data: {
            name: 'Anonymous User',
            email: `anonymous+${userId.slice(0, 8)}@deleted.invalid`,
            mobile: null,
            designation: null,
            status: UserStatus.ANONYMIZED,
            deletedAt: now,
          },
        }),
      ),
    );

    // ----- Audit log
    await logAction({
      actorId: '',
      associationId,
      action: AuditAction.ANONYMIZE,
      resourceType: 'User',
    });

    return {
      associationId,
      associationSlug: association.slug,
      processed: expiredUsers.length,
      failed: 0,
    };
  } catch (error) {
    return {
      associationId,
      associationSlug: 'unknown',
      processed: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ---- Service: All Associations ----------------------------------------------

/**
 * Run anonymization for all active associations.
 * Iterates over every active association and processes expired users in parallel.
 */
export async function runAnonymizeCron(): Promise<AnonymizeResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(associations.map((assoc) => anonymizeExpiredUsers(assoc.id)));

  return results;
}
