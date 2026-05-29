'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { PLAN_STATUSES } from '../../utils/constants';
import { getPlanStatusBadge } from '../../utils/helper/get-plan-status-badge';
import { SubscriptionPlan } from '../../types';

interface PlanStatusCellProps {
  plan: SubscriptionPlan;
  onStatusChange: (planId: string, isActive: boolean) => void;
}

export function PlanStatusCell({ plan, onStatusChange }: PlanStatusCellProps) {
  return (
    <Select
      value={plan.isActive ? 'ACTIVE' : 'INACTIVE'}
      onValueChange={(newStatus) => {
        onStatusChange(plan.id, newStatus === 'ACTIVE');
      }}
    >
      <SelectTrigger className="h-8 w-35 border-hairline">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PLAN_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {getPlanStatusBadge(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
