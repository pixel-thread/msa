import { z } from "zod";
import { pageNumberValidation, pageSizeValidiaiton } from "../common";

export const LogIngestSchema = z.object({
  level: z.enum(["info", "warn", "error", "debug"]),
  message: z.string().min(1, "Message cannot be empty"),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type LogIngestInput = z.infer<typeof LogIngestSchema>;

const LogEntrySchema = z.object({
  level: z.enum(["info", "warn", "error", "debug"]),
  message: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const LogBatchSchema = z.object({
  logs: z.array(LogEntrySchema).min(1).max(50),
});

export type LogBatchInput = z.infer<typeof LogBatchSchema>;

export const LogQuerySchema = z.object({
  page: pageNumberValidation,
  limit: pageSizeValidiaiton,
  level: z.enum(["info", "warn", "error", "debug"]).default("error").optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().default(new Date()).optional(),
  endDate: z.coerce.date().default(new Date()).optional(),
  isBackend: z.coerce.boolean().default(false).optional(),
});

export type LogQueryInput = z.infer<typeof LogQuerySchema>;
