import { z } from 'zod';

export const LogIngestSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().min(1, 'Message cannot be empty'),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type LogIngestInput = z.infer<typeof LogIngestSchema>;

const LogEntrySchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const LogBatchSchema = z.object({
  logs: z.array(LogEntrySchema).min(1).max(50),
});

export type LogBatchInput = z.infer<typeof LogBatchSchema>;
