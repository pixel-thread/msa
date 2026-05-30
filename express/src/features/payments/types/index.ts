// ---------------------------------------------------------------------------
// Payment Types — shared domain interfaces used across the payments feature
// ---------------------------------------------------------------------------

export interface ProviderResponse {
  id: string;
  associationId: string;
  provider: string;
  keyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertProviderInput {
  provider: string;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface UpdateProviderInput {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface PaymentAllocation {
  id: string;
  allocatedAmount: number;
  contributionPeriod: {
    year: number;
    month: number;
    expectedAmount: number;
    status: string;
  };
}

export interface PaymentTransaction {
  id: string;
  associationId: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  method: string | null;
  referenceNumber: string | null;
  receiptNumber: string | null;
  notes: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  razorpayRefundId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  allocations: PaymentAllocation[];
  user?: {
    name: string;
    email: string;
    membershipNumber: string | null;
  };
}

export interface ContributionPeriod {
  id: string;
  associationId: string;
  userId: string;
  year: number;
  month: number;
  expectedAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  dueDate: string;
  waivedAt: string | null;
  waivedReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  allocations: {
    id: string;
    allocatedAmount: number;
    paymentTransaction: {
      id: string;
      amount: number;
      method: string | null;
      status: string;
      paidAt: string | null;
      receiptNumber: string | null;
    };
  }[];
}

export interface ContributionSummary {
  userId: string;
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  overdueMonths: number;
  paidMonths: number;
  partialMonths: number;
  waivedMonths: number;
}

export interface UserPaymentData {
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  transactions: PaymentTransaction[];
  summary: ContributionSummary;
}

export interface UserContributionData {
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  contributions: ContributionPeriod[];
  summary: ContributionSummary;
}

// ---- Re-export Razorpay checkout types ----
export * from './razorpay-checkout';
