import { z } from "zod";

export const CreatePlanSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  billingCycle: z.enum(["ONE_TIME", "YEARLY"]).default("ONE_TIME"),
});

export const UpdatePlanSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  billingCycle: z.enum(["ONE_TIME", "YEARLY"]).optional(),
});

export const PaymentSchema = z.object({
  status: z.string(),
  message: z.string(),
  payment: z
    .object({
      id: z.string(),
      amount: z.number(),
      currency: z.string(),
      receiptNumber: z.string().optional(),
      paymentDate: z.date().optional(),
    })
    .optional(),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type PaymentOutput = z.infer<typeof PaymentSchema>;