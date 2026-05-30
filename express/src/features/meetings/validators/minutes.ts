import { z } from 'zod';

/** Zod schema for creating a meeting minute. */
export const CreateMeetingMinuteSchema = z.object({
  agendaPoint: z.string().min(1, 'Agenda point is required'),
  decision: z.string().min(1, 'Decision is required'),
  actionItems: z
    .array(
      z.object({
        assigneeId: z.uuid('Invalid assignee ID').optional(),
        task: z.string().min(1, 'Task description is required'),
        dueDate: z.coerce.date('Invalid date format').optional(),
      }),
    )
    .optional(),
});

/** Inferred type for creating a meeting minute. */
export type CreateMeetingMinuteInput = z.infer<typeof CreateMeetingMinuteSchema>;

/** Zod schema for updating a meeting minute (all fields optional). */
export const UpdateMeetingMinuteSchema = CreateMeetingMinuteSchema.partial();
/** Inferred type for updating a meeting minute. */
export type UpdateMeetingMinuteInput = z.infer<typeof UpdateMeetingMinuteSchema>;
