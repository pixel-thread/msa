type BillCycle = 'MONTHLY' | 'YEARLY';

export type SubscriptionPlanVersion = {
  id: string;
  planId: string;
  amount: number;
  currency: string;
  billingCycle: BillCycle;
  features: Record<string, unknown>;
  description: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
};

export type SubscriptionPlan = {
  id: string;
  associationId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  memberTypeId: string | null;
  activeVersion: SubscriptionPlanVersion;
  versions: SubscriptionPlanVersion[];
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
  planVersionId: string;
  status: string;
  startDate: string;
  endDate: string;
  waivedAt: string | null;
  waivedReason: string | null;
  waivedBy: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  planVersion?: SubscriptionPlanVersion;
};
