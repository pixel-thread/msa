import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { createLogs, createLogsBatch } from '@src/shared/services/logs';
import { LogIngestSchema, LogBatchSchema } from '@src/shared/validators/logs';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** POST /api/logs - Ingest a single log entry. */
export const postLog: RequestHandler[] = [
  validate({ body: LogIngestSchema.strict() }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const body = req.body;
    const context = body?.context;
    const level = body?.level;
    const message = body?.message;
    if (!level || !message || !body) throw new ValidationError('Invalid request body');
    const sanitizedContextJson = body?.context
      ? JSON.parse(JSON.stringify({ ...context, traceId }))
      : { traceId };
    const savedLog = await createLogs({
      data: {
        type: level,
        message: message as string,
        content: sanitizedContextJson,
        isBackend: true,
      },
    });
    return success(
      res,
      { data: { id: savedLog.id, traceId }, message: 'Successfully log to server' },
      201,
    );
  }),
];

/** POST /api/logs/batch - Ingest multiple log entries in a batch. */
export const postLogBatch: RequestHandler[] = [
  validate({ body: LogBatchSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
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
  }),
];
