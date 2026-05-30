import { PaymentStatus, ContributionStatus, Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Interfaces -------------------------------------------------------------

/** Shape of the dashboard overview response. */
export type DashboardOverview = {
  stats: {
    totalMembers: number;
    activeMembers: number;
    newMembersThisMonth: number;
    totalRevenueMonth: number;
    totalRevenueYear: number;
    pendingDuesAmount: number;
    pendingDuesCount: number;
  };
  revenueOverTime: Array<{
    month: string;
    revenue: number;
    pending: number;
    refunded: number;
  }>;
  memberGrowth: Array<{
    month: string;
    newMembers: number;
    totalMembers: number;
  }>;
  memberRoleDistribution: Array<{
    role: string;
    count: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  recentPayments: Array<{
    id: string;
    userName: string;
    amount: number;
    status: string;
    method: string | null;
    paymentDate: string;
  }>;
};

// ---- Helpers ----------------------------------------------------------------

/** Format a date as a YYYY-MM month key. */
function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Generate a sorted list of YYYY-MM month keys from `from` to `to` inclusive. */
function getMonthRange(from: Date, to: Date): string[] {
  const months: string[] = [];
  const current = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (current <= end) {
    months.push(toMonthKey(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

/** Fill in zero values for months that have no data, ensuring a complete series. */
function fillMonthlyGaps(
  grouped: Record<string, { revenue: number; pending: number; refunded: number }>,
  since: Date,
) {
  const months = getMonthRange(since, new Date());
  return months.map((month) => ({
    month,
    revenue: grouped[month]?.revenue ?? 0,
    pending: grouped[month]?.pending ?? 0,
    refunded: grouped[month]?.refunded ?? 0,
  }));
}

// ---- Builders ---------------------------------------------------------------

/** Build revenue-over-time series from payment transactions, grouped by month. */
function buildRevenueOverTime(
  transactions: Array<{
    amount: Prisma.Decimal;
    status: string;
    paidAt: Date | null;
  }>,
  since: Date,
) {
  const grouped: Record<string, { revenue: number; pending: number; refunded: number }> = {};

  for (const t of transactions) {
    if (!t.paidAt) continue;
    const key = toMonthKey(t.paidAt);
    if (!grouped[key]) grouped[key] = { revenue: 0, pending: 0, refunded: 0 };
    const amount = Number(t.amount);
    if (t.status === 'COMPLETED') grouped[key].revenue += amount;
    else if (t.status === 'PENDING') grouped[key].pending += amount;
    else if (t.status === 'REFUNDED') grouped[key].refunded += amount;
  }

  return fillMonthlyGaps(grouped, since);
}

/** Group users by the month they joined and count new members. */
function buildMemberCountByMonth(
  users: Array<{ createdAt: Date }>,
): Array<{ month: string; newMembers: number }> {
  const grouped: Record<string, number> = {};
  for (const u of users) {
    const key = toMonthKey(u.createdAt);
    grouped[key] = (grouped[key] || 0) + 1;
  }
  return Object.entries(grouped).map(([month, newMembers]) => ({
    month,
    newMembers,
  }));
}

/** Build a complete month-by-month member-growth series with running totals. */
function buildMemberGrowthSeries(
  raw: Array<{ month: string; newMembers: number }>,
  since: Date,
  totalMembersNow: number,
) {
  const months = getMonthRange(since, new Date());
  const map = new Map(raw.map((r) => [r.month, r.newMembers]));
  const rawTotal = raw.reduce((s, r) => s + r.newMembers, 0);
  const beforeRange = Math.max(0, totalMembersNow - rawTotal);

  let runningTotal = 0;
  return months.map((month) => {
    const newM = map.get(month) ?? 0;
    runningTotal += newM;
    return {
      month,
      newMembers: newM,
      totalMembers: beforeRange + runningTotal,
    };
  });
}

/** Count how many active users have each role, sorted by frequency descending. */
function buildRoleDistribution(
  users: Array<{ role: Array<string> }>,
): Array<{ role: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const u of users) {
    for (const role of u.role) {
      counts[role] = (counts[role] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
}

// ---- Data Access ------------------------------------------------------------

/** Retrieve payment-method usage distribution for an association. */
async function getPaymentMethodDistribution(associationId: string) {
  const rows = await prisma.paymentTransaction.groupBy({
    by: ['method'],
    where: { associationId, status: PaymentStatus.COMPLETED },
    _count: { id: true },
    _sum: { amount: true },
  });

  return rows.map((r) => ({
    method: r.method ?? 'UNKNOWN',
    count: r._count.id,
    total: Number(r._sum.amount || 0),
  }));
}

/** Retrieve the 10 most recent payments for an association. */
async function getRecentPayments(associationId: string) {
  const payments = await prisma.paymentTransaction.findMany({
    where: { associationId },
    orderBy: { paymentDate: Prisma.SortOrder.desc },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  return payments.map((p) => ({
    id: p.id,
    userName: p.user.name,
    amount: Number(p.amount),
    status: p.status,
    method: p.method,
    paymentDate: p.paymentDate.toISOString(),
  }));
}

// ---- Main Service -----------------------------------------------------------

/**
 * Compute the full dashboard overview for a given association.
 * Aggregates member counts, revenue figures, dues, and derived time-series
 * for revenue, member growth, role distribution, payment methods, and recent payments.
 */
export async function getDashboardOverview(associationId: string): Promise<DashboardOverview> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  // ----- Aggregate stats in parallel
  const [totalMembers, activeMembers, newMembersThisMonth, monthRevenue, yearRevenue, duesAgg] =
    await Promise.all([
      prisma.user.count({ where: { associationId } }),
      prisma.user.count({ where: { associationId, status: 'ACTIVE' } }),
      prisma.user.count({
        where: { associationId, createdAt: { gte: startOfMonth } },
      }),
      prisma.paymentTransaction.aggregate({
        where: {
          associationId,
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.paymentTransaction.aggregate({
        where: {
          associationId,
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: startOfYear },
        },
        _sum: { amount: true },
      }),
      prisma.contributionPeriod.aggregate({
        where: {
          associationId,
          status: {
            in: [ContributionStatus.DUE, ContributionStatus.PARTIAL, ContributionStatus.OVERDUE],
          },
        },
        _sum: { dueAmount: true },
      }),
    ]);

  const pendingDuesAmount = Number(duesAgg._sum.dueAmount || 0);

  // ----- Fetch time-series data in parallel
  const [paymentTransactions, membersSince, activeUsers] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: {
        associationId,
        paidAt: { gte: twelveMonthsAgo },
        status: {
          in: [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.REFUNDED],
        },
      },
      select: { amount: true, status: true, paidAt: true },
    }),
    prisma.user.findMany({
      where: { associationId, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { associationId, status: 'ACTIVE' },
      select: { role: true },
    }),
  ]);

  // ----- Build derived series
  const revenueOverTime = buildRevenueOverTime(paymentTransactions, twelveMonthsAgo);
  const memberGrowthRaw = buildMemberCountByMonth(membersSince);
  const memberGrowth = buildMemberGrowthSeries(memberGrowthRaw, twelveMonthsAgo, totalMembers);
  const memberRoleDistribution = buildRoleDistribution(activeUsers);

  // ----- Fetch payment-specific data
  const [paymentMethodDist, recentPaymentsRaw] = await Promise.all([
    getPaymentMethodDistribution(associationId),
    getRecentPayments(associationId),
  ]);

  return {
    stats: {
      totalMembers,
      activeMembers,
      newMembersThisMonth,
      totalRevenueMonth: Number(monthRevenue._sum.amount || 0),
      totalRevenueYear: Number(yearRevenue._sum.amount || 0),
      pendingDuesAmount,
      pendingDuesCount: memberGrowthRaw.length,
    },
    revenueOverTime,
    memberGrowth,
    memberRoleDistribution,
    paymentMethodDistribution: paymentMethodDist,
    recentPayments: recentPaymentsRaw,
  };
}
