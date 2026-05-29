'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
  newMembers: {
    label: 'New Members',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface MemberBarChartProps {
  data: DashboardOverview['memberGrowth'];
}

export function MemberBarChart({ data }: MemberBarChartProps) {
  return (
    <Card className="border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle>Member Growth</CardTitle>
        <CardDescription>New members per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
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
            <Bar dataKey="newMembers" fill="var(--color-new-members)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
