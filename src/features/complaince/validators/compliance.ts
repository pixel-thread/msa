import { z } from "zod";

export const ComplianceCheckStatusEnum = z.enum([
  "PASSED",
  "FAILED",
  "WARNING",
  "SKIPPED",
]);

export type ComplianceCheckStatus =
  (typeof ComplianceCheckStatusEnum)[keyof typeof ComplianceCheckStatusEnum];

export const ComplianceCheckTypeEnum = z.enum([
  "CONSENT_COVERAGE",
  "DSAR_SLA_COMPLIANCE",
  "DATA_RETENTION",
  "PII_ENCRYPTION",
  "SUBSCRIPTION_EXPIRY",
  "MEMBER_DATA_COMPLETENESS",
  "PAYMENT_RECONCILIATION",
  "AUDIT_LOG_INTEGRITY",
]);

export type ComplianceCheckType = (typeof ComplianceCheckTypeEnum)[keyof typeof ComplianceCheckTypeEnum];

export const ALL_CHECK_TYPES: string[] = [
  "CONSENT_COVERAGE",
  "DSAR_SLA_COMPLIANCE",
  "DATA_RETENTION",
  "PII_ENCRYPTION",
  "SUBSCRIPTION_EXPIRY",
  "MEMBER_DATA_COMPLETENESS",
  "PAYMENT_RECONCILIATION",
  "AUDIT_LOG_INTEGRITY",
];

export const TriggerComplianceCheckSchema = z.object({
  checkTypes: z
    .array(ComplianceCheckTypeEnum)
    .min(1)
    .optional(),
});

export type TriggerComplianceCheckInput = z.infer<typeof TriggerComplianceCheckSchema>;

export const ComplianceCheckQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  checkType: ComplianceCheckTypeEnum.optional(),
  status: ComplianceCheckStatusEnum.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type ComplianceCheckQueryInput = z.infer<typeof ComplianceCheckQuerySchema>;