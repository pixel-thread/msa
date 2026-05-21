import { z } from "zod";
import { UserRole, TrainingSupplementType } from "@prisma/client";

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
  requiredForRoles: z.array(z.enum(UserRole)).default([UserRole.MEMBER]),
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
  requiredForRoles: z.array(z.enum(UserRole)).optional(),
  isActive: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const RecordCompletionSchema = z.object({
  certificateUrl: z.url("Invalid certificate URL").optional(),
});

export type CreateTrainingModuleInput = z.infer<
  typeof CreateTrainingModuleSchema
>;
export type UpdateTrainingModuleInput = z.infer<
  typeof UpdateTrainingModuleSchema
>;
export const AssignTrainingSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

export const BulkAssignTrainingSchema = z.object({
  userIds: z
    .array(z.uuid("Invalid user ID"))
    .min(1, "At least one user is required"),
});

export const AdminRecordCompletionSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  moduleId: z.uuid("Invalid module ID"),
  scorePercent: z.number().min(0).max(100).optional(),
  certificateUrl: z.url("Invalid certificate URL").optional(),
});

export type RecordCompletionInput = z.infer<typeof RecordCompletionSchema>;
export type AdminRecordCompletionInput = z.infer<
  typeof AdminRecordCompletionSchema
>;
export type AssignTrainingInput = z.infer<typeof AssignTrainingSchema>;
export type BulkAssignTrainingInput = z.infer<typeof BulkAssignTrainingSchema>;

export const CreateSupplementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200)
    .trim(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  type: z.nativeEnum(TrainingSupplementType),
  fileUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const UpdateSupplementSchema = z.object({
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
  type: z.nativeEnum(TrainingSupplementType).optional(),
  fileUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSupplementInput = z.infer<typeof CreateSupplementSchema>;
export type UpdateSupplementInput = z.infer<typeof UpdateSupplementSchema>;
