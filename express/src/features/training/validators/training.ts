// ---- External libs ----
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// ---- Module schemas ----

/** Schema for creating a training module. */
export const CreateTrainingModuleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  content: z.string().min(1, 'Content is required'),
  durationMinutes: z.number().int().positive().optional(),
  requiredForRoles: z.array(z.enum(UserRole)).default([UserRole.MEMBER]),
  isActive: z.boolean().default(true),
});

/** Schema for updating a training module. */
export const UpdateTrainingModuleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim().optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  content: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  requiredForRoles: z.array(z.enum(UserRole)).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

/** Validated type for creating a training module. */
export type CreateTrainingModuleInput = z.infer<typeof CreateTrainingModuleSchema>;

/** Validated type for updating a training module. */
export type UpdateTrainingModuleInput = z.infer<typeof UpdateTrainingModuleSchema>;

// ---- Assignment schemas ----

/** Schema for assigning training to a user. */
export const AssignTrainingSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});

/** Schema for bulk assigning training to users. */
export const BulkAssignTrainingSchema = z.object({
  userIds: z.array(z.uuid('Invalid user ID')).min(1, 'At least one user is required'),
});

/** Validated type for assigning training. */
export type AssignTrainingInput = z.infer<typeof AssignTrainingSchema>;

/** Validated type for bulk-assigning training. */
export type BulkAssignTrainingInput = z.infer<typeof BulkAssignTrainingSchema>;

// ---- Completion schemas ----

/** Schema for recording a completion (no body fields). */
export const RecordCompletionSchema = z.object({});

/** Schema for admin recording a completion for another user. */
export const AdminRecordCompletionSchema = z.object({
  userId: z.uuid('Invalid user ID'),
  moduleId: z.uuid('Invalid module ID'),
  scorePercent: z.number().min(0).max(100).optional(),
});

/** Validated type for recording a completion. */
export type RecordCompletionInput = z.infer<typeof RecordCompletionSchema>;

/** Validated type for admin-recorded completion. */
export type AdminRecordCompletionInput = z.infer<typeof AdminRecordCompletionSchema>;

// ---- Supplement schemas ----

/** Schema for creating a training supplement. */
export const CreateSupplementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/** Schema for updating a training supplement. */
export const UpdateSupplementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim().optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/** Validated type for creating a supplement. */
export type CreateSupplementInput = z.infer<typeof CreateSupplementSchema>;

/** Validated type for updating a supplement. */
export type UpdateSupplementInput = z.infer<typeof UpdateSupplementSchema>;

// ---- Certificate schemas ----

/** Schema for creating a training certificate. */
export const CreateTrainingCertificateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  certificateNumber: z.string().max(100).optional(),
  issuedAt: z.string().datetime().optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

/** Schema for updating a training certificate. */
export const UpdateTrainingCertificateSchema = z.object({
  certificateNumber: z.string().max(100).optional(),
  issuedAt: z.string().datetime().optional(),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

/** Validated type for creating a certificate. */
export type CreateTrainingCertificateInput = z.infer<typeof CreateTrainingCertificateSchema>;

/** Validated type for updating a certificate. */
export type UpdateTrainingCertificateInput = z.infer<typeof UpdateTrainingCertificateSchema>;
