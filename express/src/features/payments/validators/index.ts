// ---------------------------------------------------------------------------
// Shared imports
// ---------------------------------------------------------------------------
import { z } from 'zod';
import { PaymentMethod, ContributionStatus } from '@prisma/client';
import { pageNumberValidation, pageSizeValidation } from '@src/shared/validators/common';

// ---- Create Order (Razorpay) ----

export const CreateOrderSchema = z.object({
  notes: z.string().optional(),
});

// ---- Verify Payment (Client callback from Razorpay Checkout) ----

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

// ---- Record Manual Payment (cash/UPI/bank transfer) ----

export const RecordManualPaymentSchema = z.object({
  userId: z.uuid(),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(PaymentMethod),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
});

// ---- Generate Monthly Contributions ----

export const GenerateContributionsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

// ---- Waive Contribution ----

export const WaiveContributionSchema = z.object({
  contributionPeriodId: z.uuid(),
  reason: z.string().min(1, 'Waiver reason is required'),
});

// ---- Query Schemas ----

export const PaymentHistoryQuerySchema = z.object({
  page: pageNumberValidation,
  pageSize: pageSizeValidation,
});

export const ContributionReportQuerySchema = z.object({
  userId: z.uuid(),
  fromYear: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020)),
  fromMonth: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(12)),
  toYear: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(2020)),
  toMonth: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(12)),
});

export const GetTransactionsQuerySchema = z.object({
  userId: z.uuid().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'WAIVED']).optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'ONLINE']).optional(),
  gateway: z.enum(['RAZORPAY', 'MANUAL']).optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: pageNumberValidation,
  pageSize: pageSizeValidation,
});

export const CollectionReportQuerySchema = z.object({
  page: pageNumberValidation,
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(ContributionStatus).optional(),
});

// ---- Payment Provider CRUD ----

export const UpsertPaymentProviderSchema = z.object({
  provider: z.enum(['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE']),
  keyId: z.string().min(1, 'keyId is required'),
  keySecret: z.string().min(1, 'keySecret is required'),
  webhookSecret: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePaymentProviderSchema = z.object({
  keyId: z.string().min(1).optional(),
  keySecret: z.string().min(1).optional(),
  webhookSecret: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ProviderIdParamSchema = z.object({
  providerId: z.uuid('Invalid provider ID'),
});

export const UserPaymentsParamsSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});

export const UserContributionsParamsSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});
