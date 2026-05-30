export type UserRole =
  | 'SUPER_ADMIN'
  | 'PRESIDENT'
  | 'SECRETARY'
  | 'FINANCE'
  | 'DPO'
  | 'MEMBER';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ANONYMIZED'
  | 'PENDING';

export type AnnouncementStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'ARCHIVED';

export type AnnouncementPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type MeetingType =
  | 'EC_MEETING'
  | 'GENERAL_MEETING';

export type MeetingStatus =
  | 'SCHEDULED'
  | 'NOTICE_ISSUED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AttendeeRole =
  | 'HOST'
  | 'CO_HOST'
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'OBSERVER';

export type RsvpStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED';

export type DsarRequestType =
  | 'ACCESS'
  | 'CORRECTION'
  | 'DELETION'
  | 'PORTABILITY';

export type DsarStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export type ConsentPurpose =
  | 'PAYMENTS'
  | 'COMMUNICATIONS'
  | 'MEETINGS'
  | 'ANALYTICS'
  | 'MARKETING';

export type ConsentStatus =
  | 'GRANTED'
  | 'WITHDRAWN';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'WAIVED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CHEQUE'
  | 'ONLINE';

export type PaymentGateway =
  | 'RAZORPAY'
  | 'MANUAL';

export type ContributionStatus =
  | 'DUE'
  | 'PARTIAL'
  | 'PAID'
  | 'WAIVED'
  | 'OVERDUE';

export type PaymentProviderType =
  | 'RAZORPAY'
  | 'STRIPE'
  | 'PAYU'
  | 'CASHFREE';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONSENT_GRANT'
  | 'CONSENT_REVOKE'
  | 'DSAR_SUBMIT'
  | 'DSAR_RESPOND'
  | 'PAYMENT_RECORD'
  | 'SUBSCRIPTION_CHANGE'
  | 'ANONYMIZE'
  | 'ROLE_CHANGE'
  | 'MEETING_ASSIGN'
  | 'MEETING_RSVP'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_WAIVED'
  | 'WEBHOOK_RECEIVED'
  | 'REPORT_EXPORTED'
  | 'ANNOUNCEMENT_CREATE'
  | 'ANNOUNCEMENT_PUBLISH'
  | 'ANNOUNCEMENT_DELETE'
  | 'ANNOUNCEMENT_READ'
  | 'TRAINING_MODULE_CREATE'
  | 'TRAINING_MODULE_UPDATE'
  | 'TRAINING_COMPLETE'
  | 'TRAINING_ASSIGN'
  | 'TRAINING_UNASSIGN'
  | 'COMPLAINT_CREATE'
  | 'COMPLAINT_UPDATE';

export type NotificationType =
  | 'GENERAL_MESSAGE'
  | 'FOLLOW'
  | 'SYSTEM';

export const NOTIFICATION_TYPE_VALUES = [
  'GENERAL_MESSAGE',
  'FOLLOW',
  'SYSTEM',
] as const satisfies NotificationType[];

export type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type ComplaintCategory =
  | 'MEETING_CONDUCT'
  | 'PAYMENT_DISPUTE'
  | 'DATA_PRIVACY'
  | 'MEMBER_CONDUCT'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type ComplianceCheckStatus =
  | 'PASSED'
  | 'FAILED'
  | 'WARNING'
  | 'SKIPPED';

export type TrainingAssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'EXEMPT';

export type ApplicationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type Status =
  | 'DELETED'
  | 'ACTIVE'
  | 'INACTIVE';

export type PaymentType =
  | 'SUBSCRIPTION'
  | 'DONATION'
  | 'EVENT_FEE'
  | 'BANK_INTEREST'
  | 'FAMILY_CONTRIBUTION';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  associationId: string;
  email: string;
  name: string;
  mobile: string | null;
  designation: string | null;
  role: UserRole[];
  status: UserStatus;
  dateOfJoiningGovt: Date | null;
  dateOfJoiningAssociation: Date | null;
  membershipNumber: string | null;
  overallConsentStatus: ConsentStatus;
  dataRetentionUntil: Date;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  imageUrl: string | null;
  password: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  mfaEnabled: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  memberTypeId: string | null;
  _count?: {
    payments?: number;
    meetingAttendances?: number;
  };
}
