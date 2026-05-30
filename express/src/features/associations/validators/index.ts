/**
 * @file Associations Validators Barrel
 * @description Exports all validation schemas for the associations feature.
 */

import { z } from 'zod';

// Re-export from shared validators for convenience
export { CreateAssociationSchema } from '@validator/associations';
export type { CreateAssociationInput } from '@validator/associations';

/**
 * Schema for validating association update requests.
 * Only included fields are updated; all fields are optional.
 */
export const UpdateAssociationSchema = z.object({
  /** URL-friendly identifier. Must be 2-10 lowercase letters. */
  slug: z
    .string()
    .min(2)
    .max(10)
    .toLowerCase()
    .regex(/^[a-z]+$/)
    .optional(),

  /** Display name. Between 3 and 200 characters. */
  name: z.string().min(3).max(200).optional(),

  /** Detailed description. Maximum 500 characters. */
  description: z.string().max(500).optional(),

  /** URL to the logo image. */
  logo: z.string().optional(),

  /** State or province. Maximum 100 characters. */
  state: z.string().max(100).optional(),

  /** Two-letter country code (ISO 3166-1 alpha-2). */
  country: z.string().length(2).optional(),

  /** Contact email address. */
  contactEmail: z.string().email().optional(),

  /** Contact phone number. */
  contactPhone: z.string().optional(),

  /** Hex brand color (primary). */
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),

  /** Hex brand color (secondary). */
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

/**
 * Input type inferred from UpdateAssociationSchema.
 */
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>;
