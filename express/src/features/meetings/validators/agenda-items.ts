import { z } from 'zod';
export const CreateAgendaItemSchema = z.object({
  order: z
    .number({ message: 'Order must be a number' })
    .int({ message: 'Order must be an integer' })
    .positive({ message: 'Order must be a positive number' }),
  title: z.string({ message: 'Title is required' }).min(1, 'Agenda item title is required'),
  description: z
    .string({ message: 'Description must be a string' })
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

export type CreateAgendaItemInput = z.infer<typeof CreateAgendaItemSchema>;

export const UpdateAgendaItemSchema = CreateAgendaItemSchema.partial();
export type UpdateAgendaItemInput = z.infer<typeof UpdateAgendaItemSchema>;

export const AgendaOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('CREATE'),
        data: CreateAgendaItemSchema,
      }),
      z.object({
        type: z.literal('UPDATE'),
        id: z.uuid('Invalid ID format'),
        data: UpdateAgendaItemSchema,
      }),
      z.object({
        type: z.literal('DELETE'),
        id: z.uuid('Invalid ID format'),
      }),
      z.object({
        type: z.literal('REORDER'),
        mappings: z.array(
          z.object({
            id: z.uuid('Invalid ID format'),
            order: z.number().int().positive(),
          }),
        ),
      }),
    ]),
  ),
});

export type AgendaOperationInput = z.infer<typeof AgendaOperationSchema>;
