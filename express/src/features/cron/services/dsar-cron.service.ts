import { DsarStatus, AuditAction } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';
import { logAction } from '@src/shared/services/audit-logs';

// ---- Interfaces -------------------------------------------------------------

/** Result of checking DSAR SLA deadlines for a single association. */
export interface DsarSlaResult {
  associationId: string;
  associationSlug: string;
  total: number;
  breached: number;
  atRisk: number;
  processed: boolean;
  error?: string;
}

// ---- Service: Individual Association ----------------------------------------

/**
 * Check DSAR ticket deadlines for a given association.
 * Counts total open tickets, identifies those past the response deadline (breached),
 * and those due within the next 3 days (at-risk). Logs an audit event if any issues
 * are found.
 */
export async function checkDsarDeadlines(associationId: string): Promise<DsarSlaResult> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // ----- Validate association exists
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

    // ----- Fetch total open tickets, breached tickets, and at-risk tickets in parallel
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

    // ----- Log audit if there are any SLA issues
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

// ---- Service: All Associations ----------------------------------------------

/**
 * Run DSAR SLA check for all active associations.
 * Processes every active association concurrently and returns their results.
 */
export async function runDsarSlaCron(): Promise<DsarSlaResult[]> {
  const associations = await prisma.association.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const results = await Promise.all(associations.map((assoc) => checkDsarDeadlines(assoc.id)));

  return results;
}
