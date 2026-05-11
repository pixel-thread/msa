import { z } from "zod";

export const RecordPaymentSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE"]),
  type: z.enum(["SUBSCRIPTION", "DONATION", "EVENT_FEE", "BANK_INTEREST", "FAMILY_CONTRIBUTION"]),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
});
