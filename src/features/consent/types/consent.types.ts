import type { ConsentPurpose, ConsentStatus } from '@src/shared/types';

/**
 * Represents a user's current consent state for a specific purpose.
 */
export interface UserConsentState {
  purpose: ConsentPurpose;
  status: ConsentStatus;
  updatedAt: Date;
}

/**
 * Represents a consent receipt record.
 */
export interface ConsentReceiptRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  ipAddress: string | null;
  userAgent: string | null;
  channel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  createdAt: Date;
  user?: {
    name: string | null;
    email: string | null;
  };
}

/**
 * Represents a summary report of consent statuses.
 */
export interface ConsentSummaryReport {
  purpose: ConsentPurpose;
  grantedCount: number;
  withdrawnCount: number;
  totalCount: number;
}

/**
 * Consent record as returned from the API (with user info and string dates).
 */
export interface ConsentRecord extends Omit<ConsentReceiptRecord, 'createdAt'> {
  createdAt: string;
  user?: {
    name: string | null;
    email: string | null;
  };
}
