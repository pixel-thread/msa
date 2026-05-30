import { z } from 'zod';

// Re-export from shared validators
export { CreateAssociationSchema } from '@validator/associations';
export type { CreateAssociationInput } from '@validator/associations';

// ---------------------------------------------------------------------------
// Association update schema
// ---------------------------------------------------------------------------

/** Schema for validating association update requests. Only included fields are updated. */
export const UpdateAssociationSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(10)
    .toLowerCase()
    .regex(/^[a-z]+$/)
    .optional(),
  name: z.string().min(3).max(200).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

/** Input type inferred from UpdateAssociationSchema. */
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>;
