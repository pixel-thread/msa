import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { UserStatus, AuditAction } from '@prisma/client';
import { logAction } from '@src/shared/services/audit-logs';

export interface AnonymizeResult {
  associationId: string;
  associationSlug: string;
  processed: number;
  failed: number;
  error?: string;
}

export async function anonymizeExpiredUsers(associationId: string): Promise<AnonymizeResult> {
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
        processed: 0,
        failed: 0,
        error: 'Association not found',
      };
    }

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

export async function runAnonymizeCron(): Promise<AnonymizeResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(associations.map((assoc) => anonymizeExpiredUsers(assoc.id)));

  return results;
}
