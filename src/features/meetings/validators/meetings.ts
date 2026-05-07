import { z } from "zod";
import {
  MeetingType,
  MeetingStatus,
  AttendeeRole,
  RsvpStatus,
} from "@prisma/client";

export const CreateMeetingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.nativeEnum(MeetingType),
  scheduledAt: z.string().datetime({ message: "Invalid scheduled date" }),
  venue: z.string().max(500).optional(),
});

export const UpdateMeetingSchema = z.object({
  title: z.string().min(3).optional(),
  type: z.enum(MeetingType).optional(),
  scheduledAt: z.string().datetime().optional(),
  venue: z.string().max(500).optional(),
  status: z.nativeEnum(MeetingStatus).optional(),
});

export const AssignAttendeeSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  attendeeRole: z.nativeEnum(AttendeeRole).default(AttendeeRole.OPTIONAL),
});

export const BulkAssignAttendeesSchema = z.object({
  userIds: z.array(z.string().uuid("Invalid user ID")).min(1).max(200),
  attendeeRole: z.nativeEnum(AttendeeRole).default(AttendeeRole.OPTIONAL),
});

export const UpdateAttendeeSchema = z.object({
  attendeeRole: z.nativeEnum(AttendeeRole).optional(),
  rsvpStatus: z.nativeEnum(RsvpStatus).optional(),
  rsvpNote: z.string().max(500).optional(),
});

export const MeetingQuerySchema = z.object({
  type: z.nativeEnum(MeetingType).optional(),
  status: z.nativeEnum(MeetingStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
export type AssignAttendeeInput = z.infer<typeof AssignAttendeeSchema>;
export type BulkAssignAttendeesInput = z.infer<
  typeof BulkAssignAttendeesSchema
>;
export type UpdateAttendeeInput = z.infer<typeof UpdateAttendeeSchema>;
export type MeetingQueryInput = z.infer<typeof MeetingQuerySchema>;

