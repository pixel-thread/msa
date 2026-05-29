'use client';

import Link from 'next/link';
import { SubscriptionPlan } from '../../types';

interface PlanNameCellProps {
  plan: SubscriptionPlan;
}

export function PlanNameCell({ plan }: PlanNameCellProps) {
  return (
    <Link href={`/subscriptions/plans/${plan.id}`} className="flex flex-col">
      <span className="text-sm font-medium">{plan.name}</span>
      {plan.description && (
        <span className="text-xs text-muted-foreground line-clamp-1">{plan.description}</span>
      )}
    </Link>
  );
}
