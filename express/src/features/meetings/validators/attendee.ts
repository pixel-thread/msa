import z from 'zod';
import { AttendeeRole, RsvpStatus } from '@prisma/client';

/** Zod schema for assigning a single attendee. */
export const AssignAttendeeSchema = z.object({
  userId: z.string('Invalid user ID format'),
  attendeeRole: z
    .enum(AttendeeRole, { message: 'Invalid attendee role' })
    .default(AttendeeRole.OPTIONAL),
});

/** Zod schema for bulk-assigning attendees. */
export const BulkAssignAttendeesSchema = z.object({
  userIds: z
    .array(z.uuid('Invalid user ID format'), {
      message: 'User IDs must be an array of valid UUIDs',
    })
    .min(1, 'At least one user ID is required')
    .max(200, 'Cannot assign more than 200 users at once'),
  attendeeRole: z
    .enum(AttendeeRole, { message: 'Invalid attendee role' })
    .default(AttendeeRole.OPTIONAL),
});

/** Zod schema for updating an attendee. */
export const UpdateAttendeeSchema = z.object({
  userId: z.uuid().optional(),
  attendeeRole: z.enum(AttendeeRole, { message: 'Invalid attendee role' }).optional(),
  rsvpStatus: z.enum(RsvpStatus, { message: 'Invalid RSVP status' }).optional(),
  rsvpNote: z
    .string({ message: 'RSVP note must be a string' })
    .max(500, 'RSVP note cannot exceed 500 characters')
    .optional(),
});

/** Inferred type for assigning an attendee. */
export type AssignAttendeeInput = z.infer<typeof AssignAttendeeSchema>;
/** Inferred type for bulk-assigning attendees. */
export type BulkAssignAttendeesInput = z.infer<typeof BulkAssignAttendeesSchema>;
/** Inferred type for updating an attendee. */
export type UpdateAttendeeInput = z.infer<typeof UpdateAttendeeSchema>;
