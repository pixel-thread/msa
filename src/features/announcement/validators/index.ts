import z from 'zod';
import { AnnouncementStatus, AnnouncementPriority, UserRole } from '@prisma/client';
import { pageNumberValidation, pageSizeValidation } from '@src/shared/validators/common';

import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_FORMATS, ALLOWED_MIME_TYPES } from '@src/shared/constants';

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

export const AnnouncementUploadFormData = z.object({
  file: z
    .instanceof(File, { message: 'File is required' })
    .refine((f) => f.size < MAX_IMAGE_SIZE, { message: 'File is too large' })
    .refine((f) => f.type, { message: 'File type is required' })
    .refine((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension && ALLOWED_IMAGE_FORMATS.includes(extension as never);
    }, 'Invalid file extension')
    .refine((f) => ALLOWED_MIME_TYPES.includes(f.type as never), {
      message: 'File type is not allowed',
    })
    .refine((f) => f.size > 0, { message: 'File is empty' })
    .refine(
      (f) => /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?$/.test(f.name),
      'File name contains special characters. only a-z, A-Z, 0-9 and _ are allowed',
    )
    .refine((f) => f.type.startsWith('image/'), {
      message: 'Only image files are allowed',
    }),
});

export const AnnouncementRouteParams = z.object({
  announcementId: z.uuid(),
});
