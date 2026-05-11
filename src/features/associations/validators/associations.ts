import { z } from "zod";

export const CreateAssociationSchema = z.object({
  slug: z.enum(["mfsa", "mpsa"]),
  name: z.string().min(3).max(200),
  state: z.string().max(100).optional(),
  country: z.string().length(2).default("IN"),
  contactEmail: z.email().optional(),
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

export const AddAssociationMemberSchema = z.object({
  association_id: z.uuid(),
  user_id: z.uuid,
});
