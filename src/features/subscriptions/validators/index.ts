import { z } from "zod";

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().default("INR"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("YEARLY"),
  features: z.record(z.string(), z.any()).default({}),
  memberTypeId: z.uuid().min(1).optional(),
  isActive: z.boolean().default(false),
});
export type CreateSubscriptionPlanInput = z.infer<
  typeof CreateSubscriptionPlanSchema
>;

export const SubscribeSchema = z.object({
  planId: z.uuid(),
});

export const WaiveSubscriptionSchema = z.object({
  subscriptionId: z.uuid(),
  reason: z.string().min(1),
});
