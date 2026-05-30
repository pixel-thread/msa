import { z } from 'zod';
import { MeetingType, MeetingStatus } from '@prisma/client';
import { pageNumberValidation } from '@src/shared/validators/common';

/** Zod schema for an agenda item within a meeting. */
export const agendaItemSchema = z.object({
  title: z.string({ message: 'Title is required' }).min(1, 'Agenda item title is required'),
  description: z
    .string({ message: 'Description must be a string' })
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  order: z
    .number({ message: 'Order must be a number' })
    .int({ message: 'Order must be an integer' })
    .positive({ message: 'Order must be a positive number' })
    .optional(),
});

/** Zod schema for creating a meeting. */
export const CreateMeetingSchema = z.object({
  title: z.string({ message: 'Title is required' }).min(3, 'Title must be at least 3 characters'),
  type: z.enum(MeetingType, { message: 'Meeting type is required' }),
  scheduledAt: z.coerce.date({ message: 'Scheduled date is required' }),
  venue: z
    .string({ message: 'Venue must be a string' })
    .max(500, 'Venue cannot exceed 500 characters')
    .optional(),
  agendaItems: z.array(agendaItemSchema).min(1, 'At least one agenda item is required'),
});

/** Zod schema for updating a meeting. */
export const UpdateMeetingSchema = z.object({
  title: z
    .string({ message: 'Title must be a string' })
    .min(3, 'Title must be at least 3 characters')
    .optional(),
  type: z.enum(MeetingType, { message: 'Invalid meeting type' }).optional(),
  scheduledAt: z.date({ message: 'Invalid scheduled date' }).optional(),
  venue: z
    .string({ message: 'Venue must be a string' })
    .max(500, 'Venue cannot exceed 500 characters')
    .optional(),
  status: z.enum(MeetingStatus, { message: 'Invalid meeting status' }).optional(),
});

/** Zod schema for meeting query parameters. */
export const MeetingQuerySchema = z.object({
  type: z.enum(MeetingType, { message: 'Invalid meeting type' }).optional(),
  status: z.enum(MeetingStatus, { message: 'Invalid meeting status' }).optional(),
  page: pageNumberValidation,
});

/** Inferred type for creating a meeting. */
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
/** Inferred type for updating a meeting. */
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
/** Inferred type for meeting query parameters. */
export type MeetingQueryInput = z.infer<typeof MeetingQuerySchema>;
/** Inferred type for agenda item data. */
export type AgendaItemInput = z.infer<typeof agendaItemSchema>;
