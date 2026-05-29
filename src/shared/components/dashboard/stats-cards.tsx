'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@src/shared/components/ui/card';
import { Users, IndianRupee, Clock, CreditCard } from 'lucide-react';
import type { DashboardOverview } from '@feature/dashboard/services/dashboard.service';

interface StatsCardsProps {
  stats: DashboardOverview['stats'];
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Members',
      value: stats.totalMembers.toLocaleString(),
      subtitle: `${stats.activeMembers} active`,
      icon: Users,
    },
    {
      title: 'Revenue This Month',
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(stats.totalRevenueMonth),
      subtitle: `${new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(stats.totalRevenueYear)} this year`,
      icon: IndianRupee,
    },
    {
      title: 'Pending Dues',
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(stats.pendingDuesAmount),
      subtitle: `${stats.pendingDuesCount} members`,
      icon: Clock,
    },
    {
      title: 'New Members',
      value: stats.newMembersThisMonth.toLocaleString(),
      subtitle: 'Joined this month',
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-hairline bg-surface-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ink">{card.value}</div>
            <p className="mt-1 text-xs text-body">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
