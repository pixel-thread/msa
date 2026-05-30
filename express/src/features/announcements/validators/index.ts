/**
 * @file Announcements Validators
 * @description Zod schemas for validating announcement-related requests.
 */

import z from 'zod';
import {
  AnnouncementStatus,
  AnnouncementPriority,
  UserRole,
} from '@prisma/client';

import {
  pageNumberValidation,
  pageSizeValidation,
} from '@src/shared/validators/common';

import {
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_MIME_TYPES,
} from '@src/shared/constants';

// -- Create Announcement Schema ---------------------------------------------

/**
 * Schema for creating a new announcement.
 */
export const CreateAnnouncementSchema = z.object({
  /** Title of the announcement. */
  title: z.string().min(1).max(200),

  /** Brief summary of the announcement. */
  summary: z.string().max(500).optional(),

  /** Main markdown content of the announcement. */
  content: z.string().min(1),

  /** Publishing status. Defaults to DRAFT. */
  status: z.enum(AnnouncementStatus).default(AnnouncementStatus.DRAFT),

  /** Display priority level. Defaults to NORMAL. */
  priority: z.enum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),

  /** List of roles targeted by this announcement. */
  targetRoles: z.array(z.enum(UserRole)).default([]),

  /** Whether the announcement should be pinned to the top. */
  isPinned: z.boolean().default(false),

  /** Scheduled publication date. */
  publishedAt: z.coerce.date().optional(),

  /** Expiration date for the announcement. */
  expiresAt: z.coerce.date().optional(),
});

// -- Update Announcement Schema ---------------------------------------------

/**
 * Schema for updating an existing announcement. All fields are optional.
 */
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

// -- Query Parameter Schemas ------------------------------------------------

/**
 * Schema for announcement listing query parameters.
 */
export const AnnouncementQuerySchema = z.object({
  /** Page number for pagination. */
  page: pageNumberValidation,

  /** Number of records per page. */
  limit: pageSizeValidation,

  /** Filter by status. */
  status: z.enum(AnnouncementStatus).optional(),

  /** Filter by priority. */
  priority: z.enum(AnnouncementPriority).optional(),

  /** Search term for title and summary. */
  search: z.string().optional(),
});

// -- Action Schemas ---------------------------------------------------------

/**
 * Schema for the publish/archive/unpublish action body.
 */
export const PublishAnnouncementSchema = z.object({
  /** Date when the announcement was published. */
  publishedAt: z.coerce.date().optional(),
});

/**
 * Schema for announcement route parameters.
 */
export const AnnouncementRouteParams = z.object({
  /** Unique ID of the announcement. */
  announcementId: z.uuid(),
});

// -- File Upload Schema -----------------------------------------------------

/**
 * Schema for announcement image upload form data.
 * Validates file size, extension, name, and MIME type.
 */
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

// -- Inferred Types ---------------------------------------------------------

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;

export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;

export type AnnouncementQuery = z.infer<typeof AnnouncementQuerySchema>;
