import z from "zod";
import {
  AnnouncementStatus,
  AnnouncementPriority,
  UserRole,
} from "@prisma/client";
import {
  pageNumberValidation,
  pageSizeValidation,
} from "@src/shared/validators/common";

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(500).optional(),
  content: z.string().min(1),
  status: z.enum(AnnouncementStatus).default(AnnouncementStatus.DRAFT),
  priority: z.enum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
  targetRoles: z.array(z.enum(UserRole)).default([]),
  isPinned: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  imageUrl: z.url().optional().nullable(),
  status: z.enum(AnnouncementStatus).optional(),
  priority: z.enum(AnnouncementPriority).optional(),
  targetRoles: z.array(z.enum(UserRole)).optional(),
  isPinned: z.boolean().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const AnnouncementQuerySchema = z.object({
  page: pageNumberValidation,
  limit: pageSizeValidation,
  status: z.enum(AnnouncementStatus).optional(),
  priority: z.enum(AnnouncementPriority).optional(),
  search: z.string().optional(),
});

export const PublishAnnouncementSchema = z.object({
  publishedAt: z.coerce.date().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
export type AnnouncementQuery = z.infer<typeof AnnouncementQuerySchema>;
