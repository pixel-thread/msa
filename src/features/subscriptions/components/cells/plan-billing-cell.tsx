'use client';

import { Badge } from '@src/shared/components/ui/badge';
import { SubscriptionPlan } from '../../types';

interface PlanBillingCellProps {
  plan: SubscriptionPlan;
}

export function PlanBillingCell({ plan }: PlanBillingCellProps) {
  const billingCycle = plan.activeVersion?.billingCycle ?? 'MONTHLY';
  const variant = billingCycle === 'YEARLY' ? 'default' : 'secondary';

  return (
    <Badge variant={variant} className="capitalize">
      {billingCycle.toLowerCase()}
    </Badge>
  );
}
