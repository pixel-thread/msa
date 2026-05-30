import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { createLogs, createLogsBatch } from '@src/shared/services/logs';
import { LogIngestSchema, LogBatchSchema } from '@src/shared/validators/logs';
import { Prisma } from '@prisma/client';

export const postLog = [
  validate({ body: LogIngestSchema.strict() }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traceId = (req.headers['x-trace-id'] as string) || '';
      const body = req.body;
      const context = body?.context;
      const level = body?.level;
      const message = body?.message;
      if (!level || !message || !body) throw new ValidationError('Invalid request body');
      const sanitizedContextJson = body?.context
        ? JSON.parse(JSON.stringify({ ...context, traceId }))
        : { traceId };
      const savedLog = await createLogs({
        data: { type: level, message: message as string, content: sanitizedContextJson, isBackend: true },
      });
      return success(res, { data: { id: savedLog.id, traceId }, message: 'Successfully log to server' }, 201);
    } catch (e) { next(e); }
  },
];

export const postLogBatch = [
  validate({ body: LogBatchSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const traceId = (req.headers['x-trace-id'] as string) || '';
      const { logs } = req.body!;
      await createLogsBatch({
        data: logs.map((l: any) => ({
          type: l.level,
          message: l.message,
          content: JSON.parse(JSON.stringify({ ...l.context, traceId })) as Prisma.InputJsonValue,
          isBackend: false,
        })),
      });
      return success(res, { data: null, message: 'Logs ingested successfully' }, 201);
    } catch (e) { next(e); }
  },
];
