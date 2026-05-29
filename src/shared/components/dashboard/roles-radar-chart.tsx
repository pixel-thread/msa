'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

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
  count: {
    label: 'Members',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface RolesRadarChartProps {
  data: DashboardOverview['memberRoleDistribution'];
}

export function RolesRadarChart({ data }: RolesRadarChartProps) {
  return (
    <Card className="border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle>Role Distribution</CardTitle>
        <CardDescription>Members by association role</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <RadarChart data={data} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="role" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Radar
              dataKey="count"
              fill="var(--color-radar)"
              fillOpacity={0.3}
              stroke="var(--color-radar)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
