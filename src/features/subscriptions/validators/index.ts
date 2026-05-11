import { z } from "zod";

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().default("INR"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("YEARLY"),
  features: z.record(z.any()).default({}),
});

export const SubscribeSchema = z.object({
  planId: z.string().uuid(),
});

export const WaiveSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.string().min(1),
});
