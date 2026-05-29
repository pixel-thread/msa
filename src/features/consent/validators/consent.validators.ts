import { z } from 'zod';
import { ConsentPurpose, ConsentStatus } from '@prisma/client';

/**
 * Validator for granting or revoking consent.
 */
export const ConsentUpdateSchema = z.object({
  purposes: z.array(z.enum(ConsentPurpose)).min(1, 'At least one purpose is required'),
  action: z.enum(ConsentStatus),
  channel: z.enum(['web', 'mobile', 'email']).default('web'),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Type derived from ConsentUpdateSchema.
 */
export type ConsentUpdateInput = z.infer<typeof ConsentUpdateSchema>;

/**
 * Validator for consent report query parameters.
 */
export const ConsentReportQuerySchema = z.object({
  purpose: z.enum(ConsentPurpose).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Type derived from ConsentReportQuerySchema.
 */
export type ConsentReportQueryInput = z.infer<typeof ConsentReportQuerySchema>;

/**
 * Validator for consent receipt params.
 */
export const ConsentReceiptParamsSchema = z.object({
  receiptId: z.uuid('Invalid receipt ID'),
});

export type ConsentReceiptParamsInput = z.infer<typeof ConsentReceiptParamsSchema>;

/**
 * Validator for updating a single consent receipt.
 */
export const UpdateConsentReceiptSchema = z.object({
  status: z.enum(ConsentStatus).optional(),
  channel: z.enum(['web', 'mobile', 'email']).optional(),
});

export type UpdateConsentReceiptInput = z.infer<typeof UpdateConsentReceiptSchema>;

/**
 * Validator for querying all consent records.
 */
export const AllConsentRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).optional(),
  purpose: z.enum(ConsentPurpose).optional(),
  status: z.enum(ConsentStatus).optional(),
  search: z.string().optional(),
});

export type AllConsentRecordsQueryInput = z.infer<typeof AllConsentRecordsQuerySchema>;
