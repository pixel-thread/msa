import { z } from 'zod';

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

export type CreateMeetingMinuteInput = z.infer<typeof CreateMeetingMinuteSchema>;

export const UpdateMeetingMinuteSchema = CreateMeetingMinuteSchema.partial();
export type UpdateMeetingMinuteInput = z.infer<typeof UpdateMeetingMinuteSchema>;
