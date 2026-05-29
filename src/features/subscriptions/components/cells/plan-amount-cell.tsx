'use client';

import { SubscriptionPlan } from '../../types';

interface PlanAmountCellProps {
  plan: SubscriptionPlan;
}

export function PlanAmountCell({ plan }: PlanAmountCellProps) {
  const amount = plan.activeVersion?.amount ?? 0;
  const currency = plan.activeVersion?.currency ?? 'INR';

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  return <span className="text-sm font-medium text-ink">{formattedAmount}</span>;
}
