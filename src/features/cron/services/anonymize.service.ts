import { prisma } from "@src/shared/lib/prisma";
import { UserStatus, AuditAction } from "@prisma/client";

export interface AnonymizeResult {
  associationId: string;
  associationSlug: string;
  processed: number;
  failed: number;
  error?: string;
}

export async function anonymizeExpiredUsers(
  associationId: string,
): Promise<AnonymizeResult> {
  try {
    const now = new Date();

    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { slug: true },
    });

    if (!association) {
      return {
        associationId,
        associationSlug: "unknown",
        processed: 0,
        failed: 0,
        error: "Association not found",
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

    const anonymizedEmails = expiredUsers.map(
      (u) => `anonymous+${u.id.slice(0, 8)}@deleted.invalid`,
    );

    await prisma.user.updateMany({
      where: {
        id: { in: expiredUsers.map((u) => u.id) },
      },
      data: {
        name: "Anonymous User",
        email: {
          in: anonymizedEmails,
        },
        mobile: null,
        designation: null,
        status: UserStatus.ANONYMIZED,
        deletedAt: now,
      },
    });

    await prisma.auditLog.create({
      data: {
        associationId,
        action: AuditAction.ANONYMIZE,
        details: {
          anonymizedCount: expiredUsers.length,
          userIds: expiredUsers.map((u) => u.id),
        },
      },
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
      associationSlug: "unknown",
      processed: 0,
      failed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runAnonymizeCron(): Promise<AnonymizeResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(
    associations.map((assoc) => anonymizeExpiredUsers(assoc.id)),
  );

  return results;
}