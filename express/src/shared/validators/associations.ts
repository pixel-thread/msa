import { z } from 'zod';

export const CreateAssociationSchema = z.object({
  slug: z
    .string({
      error: 'Slug is required',
    })
    .min(2, {
      error: 'Slug must be at least 2 characters long',
    })
    .max(10, {
      error: 'Slug cannot exceed 10 characters',
    })
    .toLowerCase()
    .regex(/^[a-z]+$/, {
      error: 'Slug can only contain lowercase letters (a-z)',
    }),

  name: z
    .string({
      error: 'Association name is required',
    })
    .min(3, {
      error: 'Association name must be at least 3 characters long',
    })
    .max(200, {
      error: 'Association name cannot exceed 200 characters',
    }),

  state: z
    .string()
    .max(100, {
      error: 'State name cannot exceed 100 characters',
    })
    .optional(),

  description: z
    .string()
    .max(500, {
      error: 'Description cannot exceed 500 characters',
    })
    .optional(),

  logo: z.string().optional(),

  country: z
    .string()
    .length(2, {
      error: 'Country must be a valid 2-letter ISO country code',
    })
    .default('IN'),

  contactEmail: z
    .email({
      error: 'Please provide a valid email address',
    })
    .optional(),

  contactPhone: z.string().optional(),

  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, {
      error: 'Primary color must be a valid hex color (e.g. #1e40af)',
    })
    .optional(),

  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, {
      error: 'Secondary color must be a valid hex color (e.g. #f59e0b)',
    })
    .optional(),
});

export type CreateAssociationInput = z.infer<typeof CreateAssociationSchema>;
