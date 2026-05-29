import { z } from 'zod';

export const CreateMemberTypeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255),
  level: z.number().int().positive('Level must be a positive integer'),
});

export const UpdateMemberTypeSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  level: z.number().int().positive().optional(),
});

export const MemberTypeParamsSchema = z.object({
  memberTypeId: z.uuid('Invalid member type ID'),
});

export type CreateMemberTypeInput = z.infer<typeof CreateMemberTypeSchema>;
export type UpdateMemberTypeInput = z.infer<typeof UpdateMemberTypeSchema>;
