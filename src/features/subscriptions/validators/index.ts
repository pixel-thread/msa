import { z } from 'zod';

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().default('INR'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('YEARLY'),
  features: z.record(z.string(), z.any()).default({}),
  memberTypeId: z.string().optional(),
  isActive: z.boolean().default(true),
  effectiveTo: z.coerce.date().optional(),
  effectiveFrom: z.coerce.date().optional(),
});

export type CreateSubscriptionPlanInput = z.infer<typeof CreateSubscriptionPlanSchema>;

export const SubscribeSchema = z.object({
  planId: z.uuid(),
});

export const WaiveSubscriptionSchema = z.object({
  subscriptionId: z.uuid(),
  reason: z.string().min(1),
});

export const UpgradeSubscriptionSchema = z.object({
  planId: z.uuid(),
});
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;
