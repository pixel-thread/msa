// ---- Types -------------------------------------------------------------------

/** Supported billing cycle types. */
type BillCycle = 'MONTHLY' | 'YEARLY';

/** Represents a versioned snapshot of a subscription plan's pricing and features. */
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

/** Represents a subscription plan entity with its active version. */
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

/** Lightweight subscription plan item for list views. */
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

/** Represents a user's subscription. */
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
