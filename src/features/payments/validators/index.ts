import { z } from "zod";

// ---------------------------------------------------------------------------
// Create Order (Razorpay)
// ---------------------------------------------------------------------------

export const CreateOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Verify Payment (Client callback from Razorpay Checkout)
// ---------------------------------------------------------------------------

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Razorpay order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

// ---------------------------------------------------------------------------
// Record Manual Payment (cash/UPI/bank transfer)
// ---------------------------------------------------------------------------

export const RecordManualPaymentSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Generate Monthly Contributions
// ---------------------------------------------------------------------------

export const GenerateContributionsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

// ---------------------------------------------------------------------------
// Waive Contribution
// ---------------------------------------------------------------------------

export const WaiveContributionSchema = z.object({
  contributionPeriodId: z.string().uuid(),
  reason: z.string().min(1, "Waiver reason is required"),
});

// ---------------------------------------------------------------------------
// Query Schemas
// ---------------------------------------------------------------------------

export const PaymentHistoryQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .optional(),
  pageSize: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
});

export const ContributionReportQuerySchema = z.object({
  userId: z.string().uuid(),
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
