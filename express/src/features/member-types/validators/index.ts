// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Member-type validators
//
// Schemas for member-type CRUD operations and path parameters.
// ---------------------------------------------------------------------------

/** Schema for creating a new member type. */
export const CreateMemberTypeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255),
  level: z.number().int().positive('Level must be a positive integer'),
});

/** Schema for updating an existing member type. */
export const UpdateMemberTypeSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  level: z.number().int().positive().optional(),
});

/** Schema for member type ID path parameter. */
export const MemberTypeParamsSchema = z.object({
  memberTypeId: z.uuid('Invalid member type ID'),
});

/** Input type inferred from CreateMemberTypeSchema. */
export type CreateMemberTypeInput = z.infer<typeof CreateMemberTypeSchema>;

/** Input type inferred from UpdateMemberTypeSchema. */
export type UpdateMemberTypeInput = z.infer<typeof UpdateMemberTypeSchema>;
