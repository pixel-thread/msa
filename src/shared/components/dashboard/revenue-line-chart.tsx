'use client';

import { Line, LineChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@src/shared/components/ui/chart';
import type { DashboardOverview } from '@feature/dashboard/services/dashboard.service';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  totalMembers: {
    label: 'Total Members',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface RevenueLineChartProps {
  revenueData: DashboardOverview['revenueOverTime'];
  memberData: DashboardOverview['memberGrowth'];
}

export function RevenueLineChart({ revenueData, memberData }: RevenueLineChartProps) {
  const merged = revenueData.map((r) => {
    const m = memberData.find((md) => md.month === r.month);
    return {
      month: r.month,
      revenue: r.revenue,
      totalMembers: m?.totalMembers ?? 0,
    };
  });

  return (
    <Card className="border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Revenue over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <LineChart data={merged} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => {
                const [y, m] = value.split('-');
                const date = new Date(Number(y), Number(m) - 1);
                return date.toLocaleDateString('en-US', { month: 'short' });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const value = typeof label === 'string' ? label : '';
                    const [y, m] = value.split('-');
                    if (!y || !m) return value;
                    const date = new Date(Number(y), Number(m) - 1);
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-revenue)' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
