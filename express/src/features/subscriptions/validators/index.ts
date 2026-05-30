// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { z } from 'zod';

// ---- Create subscription plan ------------------------------------------------

/** Schema for creating a new subscription plan. */
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

/** Input type inferred from CreateSubscriptionPlanSchema. */
export type CreateSubscriptionPlanInput = z.infer<typeof CreateSubscriptionPlanSchema>;

// ---- Subscribe ---------------------------------------------------------------

/** Schema for validating subscription signup requests. */
export const SubscribeSchema = z.object({
  planId: z.uuid(),
});

// ---- Waive subscription -----------------------------------------------------

/** Schema for validating subscription waiver requests. */
export const WaiveSubscriptionSchema = z.object({
  subscriptionId: z.uuid(),
  reason: z.string().min(1),
});

// ---- Upgrade subscription ----------------------------------------------------

/** Schema for validating subscription upgrade requests. */
export const UpgradeSubscriptionSchema = z.object({
  planId: z.uuid(),
});

/** Input type inferred from UpgradeSubscriptionSchema. */
export type UpgradeSubscriptionInput = z.infer<typeof UpgradeSubscriptionSchema>;
