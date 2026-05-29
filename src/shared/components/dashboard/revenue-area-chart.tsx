'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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
  pending: {
    label: 'Pending',
    color: 'hsl(var(--chart-3))',
  },
  refunded: {
    label: 'Refunded',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

interface RevenueAreaChartProps {
  data: DashboardOverview['revenueOverTime'];
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  return (
    <Card className="border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue, pending, and refunded amounts</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillRefunded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-refunded)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-refunded)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
            <Area
              dataKey="refunded"
              type="monotone"
              fill="url(#fillRefunded)"
              stroke="var(--color-refunded)"
              stackId="1"
            />
            <Area
              dataKey="pending"
              type="monotone"
              fill="url(#fillPending)"
              stroke="var(--color-pending)"
              stackId="1"
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
