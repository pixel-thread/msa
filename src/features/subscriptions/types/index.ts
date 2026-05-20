type BillCycle = "MONTHLY" | "YEARLY";

export type SubscriptionPlan = {
  id: string;
  associationId: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  billingCycle: BillCycle;
  features: Record<string, unknown>;
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
  memberTypeId: string | null;
};

export type SubscriptionPlanListItem = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  billingCycle: BillCycle;
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  waivedAt: string | null;
  waivedReason: string | null;
  waivedBy: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
};
