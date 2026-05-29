import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { ContributionStatus, UserStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContributionSummary {
  userId: string;
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  overdueMonths: number;
  paidMonths: number;
  partialMonths: number;
  waivedMonths: number;
}

export interface MonthlyContributionRow {
  year: number;
  month: number;
  expectedAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: ContributionStatus;
  dueDate: Date;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Generate contribution period rows for a given month/year for ALL active
 * members of an association who have an active subscription.
 *
 * This is idempotent — if a row already exists for (userId, year, month) it
 * will be skipped via `skipDuplicates`.
 *
 * Intended to be called by a monthly cron job.
 */
export async function generateMonthlyContributions(
  associationId: string,
  year: number,
  month: number,
): Promise<number> {
  // Get all active members with active subscriptions
  const activeMembers = await prisma.user.findMany({
    where: {
      associationId,
      status: UserStatus.ACTIVE,
      subscription: {
        status: 'ACTIVE',
      },
    },
    include: {
      subscription: {
        include: { plan: true, planVersion: true },
      },
    },
  });

  if (activeMembers.length === 0) return 0;

  // Calculate due date — last day of the month
  const dueDate = new Date(year, month, 0); // day 0 of next month = last day

  const data = activeMembers
    .filter((m) => m.subscription?.planVersion)
    .map((member) => {
      const expectedAmount = member.subscription!.planVersion.amount;

      return {
        associationId,
        userId: member.id,
        year,
        month,
        expectedAmount,
        paidAmount: 0,
        dueAmount: expectedAmount,
        status: ContributionStatus.DUE,
        dueDate,
      };
    });

  const result = await prisma.contributionPeriod.createMany({
    data: data as Array<{
      associationId: string;
      userId: string;
      year: number;
      month: number;
      // eslint-disable-next-line
      expectedAmount: any;
      // eslint-disable-next-line
      paidAmount: any;
      // eslint-disable-next-line
      dueAmount: any;
      status: ContributionStatus;
      dueDate: Date;
    }>,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Mark all DUE contributions whose dueDate has passed as OVERDUE.
 */
export async function markOverdueContributions(associationId: string): Promise<number> {
  const now = new Date();

  const result = await prisma.contributionPeriod.updateMany({
    where: {
      associationId,
      status: ContributionStatus.DUE,
      dueDate: { lt: now },
    },
    data: {
      status: ContributionStatus.OVERDUE,
    },
  });

  return result.count;
}

/**
 * Get all outstanding (DUE / PARTIAL / OVERDUE) contribution periods for a user,
 * ordered chronologically (oldest first — for FIFO allocation).
 */
export async function getOutstandingContributions(userId: string) {
  return prisma.contributionPeriod.findMany({
    where: {
      userId,
      status: {
        in: [ContributionStatus.DUE, ContributionStatus.PARTIAL, ContributionStatus.OVERDUE],
      },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });
}

/**
 * Get a user's contribution summary (for member/finance reports).
 */
export async function getUserContributionSummary(userId: string): Promise<ContributionSummary> {
  const contributions = await prisma.contributionPeriod.findMany({
    where: { userId },
  });

  let totalExpected = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let overdueMonths = 0;
  let paidMonths = 0;
  let partialMonths = 0;
  let waivedMonths = 0;

  for (const c of contributions) {
    totalExpected += Number(c.expectedAmount);
    totalPaid += Number(c.paidAmount);
    totalDue += Number(c.dueAmount);

    switch (c.status) {
      case ContributionStatus.OVERDUE:
        overdueMonths++;
        break;
      case ContributionStatus.PAID:
        paidMonths++;
        break;
      case ContributionStatus.PARTIAL:
        partialMonths++;
        break;
      case ContributionStatus.WAIVED:
        waivedMonths++;
        break;
    }
  }

  return {
    userId,
    totalExpected,
    totalPaid,
    totalDue,
    overdueMonths,
    paidMonths,
    partialMonths,
    waivedMonths,
  };
}

/**
 * Waive a contribution period (e.g. for hardship, honorary members, etc.).
 */
export async function waiveContribution(contributionPeriodId: string, reason: string) {
  return prisma.contributionPeriod.update({
    where: { id: contributionPeriodId },
    data: {
      status: ContributionStatus.WAIVED,
      dueAmount: 0,
      waivedAt: new Date(),
      waivedReason: reason,
    },
  });
}

/**
 * Get contribution periods for a user in a date range (for member reports).
 */
export async function getUserContributions(
  userId: string,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
) {
  return prisma.contributionPeriod.findMany({
    where: {
      userId,
      OR: [
        {
          year: { gt: fromYear, lt: toYear },
        },
        {
          year: fromYear,
          month: { gte: fromMonth },
        },
        {
          year: toYear,
          month: { lte: toMonth },
        },
      ],
    },
    include: {
      allocations: {
        include: {
          paymentTransaction: {
            select: {
              id: true,
              amount: true,
              method: true,
              gateway: true,
              status: true,
              paidAt: true,
              receiptNumber: true,
            },
          },
        },
      },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });
}
