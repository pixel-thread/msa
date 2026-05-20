"use client";

import { SubscriptionPlan } from "../../types";

interface PlanAmountCellProps {
  plan: SubscriptionPlan;
}

export function PlanAmountCell({ plan }: PlanAmountCellProps) {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.amount);

  return (
    <span className="text-sm font-medium text-ink">
      {formattedAmount}
    </span>
  );
}
