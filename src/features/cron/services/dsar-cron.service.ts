import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { DsarStatus, AuditAction } from '@prisma/client';
import { logAction } from '@src/shared/services/audit-logs';

export interface DsarSlaResult {
  associationId: string;
  associationSlug: string;
  total: number;
  breached: number;
  atRisk: number;
  processed: boolean;
  error?: string;
}

export async function checkDsarDeadlines(associationId: string): Promise<DsarSlaResult> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { slug: true },
    });

    if (!association) {
      return {
        associationId,
        associationSlug: 'unknown',
        total: 0,
        breached: 0,
        atRisk: 0,
        processed: false,
        error: 'Association not found',
      };
    }

    const [total, breachedTickets, atRiskTickets] = await Promise.all([
      prisma.dsarTicket.count({
        where: {
          associationId,
          status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        },
      }),
      prisma.dsarTicket.findMany({
        where: {
          associationId,
          status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
          responseDeadline: { lt: now },
        },
        select: { id: true, ticketNumber: true },
      }),
      prisma.dsarTicket.findMany({
        where: {
          associationId,
          status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
          responseDeadline: { gte: now, lte: threeDaysFromNow },
        },
        select: { id: true, ticketNumber: true },
      }),
    ]);

    const breached = breachedTickets.length;
    const atRisk = atRiskTickets.length;

    if (breached > 0 || atRisk > 0) {
      await logAction({
        actorId: '',
        associationId,
        action: AuditAction.DSAR_RESPOND,
        resourceType: 'DsarTicket',
      });
    }

    return {
      associationId,
      associationSlug: association.slug,
      total,
      breached,
      atRisk,
      processed: true,
    };
  } catch (error) {
    return {
      associationId,
      associationSlug: 'unknown',
      total: 0,
      breached: 0,
      atRisk: 0,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function runDsarSlaCron(): Promise<DsarSlaResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(associations.map((assoc) => checkDsarDeadlines(assoc.id)));

  return results;
}
