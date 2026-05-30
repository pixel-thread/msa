import { pageNumberValidation } from '@src/shared/validators/common';
import { z } from 'zod';

/** Enum schema for compliance check statuses. */
export const ComplianceCheckStatusEnum = z.enum(['PASSED', 'FAILED', 'WARNING', 'SKIPPED']);

export type ComplianceCheckStatus =
  (typeof ComplianceCheckStatusEnum)[keyof typeof ComplianceCheckStatusEnum];

/** Enum schema for compliance check types. */
export const ComplianceCheckTypeEnum = z.enum([
  'CONSENT_COVERAGE',
  'DSAR_SLA_COMPLIANCE',
  'DATA_RETENTION',
  'PII_ENCRYPTION',
  'SUBSCRIPTION_EXPIRY',
  'MEMBER_DATA_COMPLETENESS',
  'PAYMENT_RECONCILIATION',
  'AUDIT_LOG_INTEGRITY',
]);

export type ComplianceCheckType =
  (typeof ComplianceCheckTypeEnum)[keyof typeof ComplianceCheckTypeEnum];

/** All available compliance check type strings. */
export const ALL_CHECK_TYPES: string[] = [
  'CONSENT_COVERAGE',
  'DSAR_SLA_COMPLIANCE',
  'DATA_RETENTION',
  'PII_ENCRYPTION',
  'SUBSCRIPTION_EXPIRY',
  'MEMBER_DATA_COMPLETENESS',
  'PAYMENT_RECONCILIATION',
  'AUDIT_LOG_INTEGRITY',
];

/** Schema for triggering specific compliance checks. */
export const TriggerComplianceCheckSchema = z.object({
  checkTypes: z.array(ComplianceCheckTypeEnum).min(1).optional(),
});

export type TriggerComplianceCheckInput = z.infer<typeof TriggerComplianceCheckSchema>;

/** Query schema for listing compliance checks with filters and pagination. */
export const ComplianceCheckQuerySchema = z.object({
  page: pageNumberValidation,
  checkType: ComplianceCheckTypeEnum.optional(),
  status: ComplianceCheckStatusEnum.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type ComplianceCheckQueryInput = z.infer<typeof ComplianceCheckQuerySchema>;

/** Params schema for compliance check route parameters. */
export const ComplianceCheckParamsSchema = z.object({
  checkId: z.string().uuid('Invalid check ID'),
});

export type ComplianceCheckParamsInput = z.infer<typeof ComplianceCheckParamsSchema>;
