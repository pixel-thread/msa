'use client';

import { Star } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { SubscriptionPlan } from '../../types';

interface PlanDefaultCellProps {
  plan: SubscriptionPlan;
  onSetDefault: (planId: string) => void;
}

export function PlanDefaultCell({ plan, onSetDefault }: PlanDefaultCellProps) {
  return (
    <div className="flex items-center justify-center">
      <Button
        size="sm"
        variant={plan.isDefault ? 'default' : 'ghost'}
        onClick={() => !plan.isDefault && onSetDefault(plan.id)}
        disabled={plan.isDefault}
        className="h-8 w-8 p-0"
        title={plan.isDefault ? 'Default plan' : 'Set as default plan'}
      >
        <Star className={`h-4 w-4 ${plan.isDefault ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}
