import { z } from "zod";
import { pageNumberValidation } from "../common";

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
  level: z
    .union([
      z.enum(["info", "warn", "error", "debug"]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  search: z.string().optional(),
  messageExact: z.string().optional(),
  contentSearch: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isBackend: z.coerce.boolean().optional(),
  ids: z.string().optional(),
  sortBy: z.enum(["createdAt", "type", "message"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: pageNumberValidation.optional(),
});

export type LogQueryInput = z.infer<typeof LogQuerySchema>;
