import { z } from "zod";
import { UserRole } from "@prisma/client";

export const CreateTrainingModuleSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200)
    .trim(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  content: z.string().min(1, "Content is required"),
  durationMinutes: z.number().int().positive().optional(),
  requiredForRoles: z.array(z.nativeEnum(UserRole)).default([UserRole.MEMBER]),
  isActive: z.boolean().default(true),
});

export const UpdateTrainingModuleSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200)
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  content: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  requiredForRoles: z.array(z.nativeEnum(UserRole)).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const RecordCompletionSchema = z.object({
  certificateUrl: z.string().url("Invalid certificate URL").optional(),
});

export type CreateTrainingModuleInput = z.infer<
  typeof CreateTrainingModuleSchema
>;
export type UpdateTrainingModuleInput = z.infer<
  typeof UpdateTrainingModuleSchema
>;
export const AssignTrainingSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const BulkAssignTrainingSchema = z.object({
  userIds: z.array(z.string().uuid("Invalid user ID")).min(1, "At least one user is required"),
});

export const AdminRecordCompletionSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  moduleId: z.string().uuid("Invalid module ID"),
  scorePercent: z.number().min(0).max(100).optional(),
  certificateUrl: z.string().url("Invalid certificate URL").optional(),
});

export type RecordCompletionInput = z.infer<typeof RecordCompletionSchema>;
export type AdminRecordCompletionInput = z.infer<typeof AdminRecordCompletionSchema>;
export type AssignTrainingInput = z.infer<typeof AssignTrainingSchema>;
export type BulkAssignTrainingInput = z.infer<typeof BulkAssignTrainingSchema>;
