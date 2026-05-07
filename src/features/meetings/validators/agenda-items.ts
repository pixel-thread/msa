import { z } from "zod";

export const CreateAgendaItemSchema = z.object({
  order: z
    .number({ message: "Order must be a number" })
    .int({ message: "Order must be an integer" })
    .positive({ message: "Order must be a positive number" }),
  title: z
    .string({ message: "Title is required" })
    .min(1, "Agenda item title is required"),
  description: z
    .string({ message: "Description must be a string" })
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
});

export type CreateAgendaItemInput = z.infer<typeof CreateAgendaItemSchema>;