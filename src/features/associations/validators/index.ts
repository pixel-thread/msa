import { z } from "zod";

export const CreateAssociationSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(10)
    .toLowerCase()
    .regex(/^[a-z]+$/),
  name: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default("IN"),
  contactEmail: z.string().email().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

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
  state: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  contactEmail: z.string().email().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

export type CreateAssociationInput = z.infer<typeof CreateAssociationSchema>;
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>;
