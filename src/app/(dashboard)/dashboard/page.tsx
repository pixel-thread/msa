'use client';

import { useDashboard } from '@src/shared/hooks/use-dashboard';
import { SectionHeader } from '@src/shared/components/section-header';
import { StatsCards } from '@src/shared/components/dashboard/stats-cards';
import { RevenueAreaChart } from '@src/shared/components/dashboard/revenue-area-chart';
import { MemberBarChart } from '@src/shared/components/dashboard/member-bar-chart';
import { RevenueLineChart } from '@src/shared/components/dashboard/revenue-line-chart';
import { PaymentPieChart } from '@src/shared/components/dashboard/payment-pie-chart';
import { RolesRadarChart } from '@src/shared/components/dashboard/roles-radar-chart';
import { RecentPaymentsTable } from '@src/shared/components/dashboard/recent-payments-table';
import { DashboardSkeleton } from '@src/shared/components/dashboard/dashboard-skeleton';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Dashboard"
          description="Association analytics and overview"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-ink">Failed to load dashboard</h2>
          <p className="mt-2 text-sm text-body">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-active"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        description="Association analytics and overview"
      />

      <StatsCards stats={data.stats} />

      <RevenueAreaChart data={data.revenueOverTime} />

      <div className="grid gap-4 md:grid-cols-2">
        <MemberBarChart data={data.memberGrowth} />
        <RevenueLineChart revenueData={data.revenueOverTime} memberData={data.memberGrowth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PaymentPieChart data={data.paymentMethodDistribution} />
        <RolesRadarChart data={data.memberRoleDistribution} />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-ink">Recent Payments</h2>
        <RecentPaymentsTable payments={data.recentPayments} />
      </div>
    </div>
  );
}
