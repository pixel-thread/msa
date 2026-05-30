// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// Shared utilities
import { asyncHandler } from '@src/shared/utils/async-handler';
import { success } from '@src/shared/utils/responses';
import { validate } from '@src/shared/lib/validate';
import { ValidationError } from '@src/shared/errors';

// ---- Prisma

import { Prisma } from '@prisma/client';

// ---- Services

import { createLogs, createLogsBatch } from '@src/shared/services/logs';

// ---- Validators / Types

import { LogIngestSchema, LogBatchSchema } from '@src/shared/validators/logs';

// ---------------------------------------------------------------------------
// POST /api/logs
// Ingest a single log entry from the client.
// Security: Public — no auth required; rate-limited at the proxy level.
// ---------------------------------------------------------------------------

export const postLog: RequestHandler[] = [
  // ---- Validate input

  validate({ body: LogIngestSchema.strict() }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    const body = req.body;

    // ---- Extract fields

    // Each field is extracted separately so that future per-field
    // transformations (e.g. PII scrubbing) can be added without
    // restructuring the handler.
    const context = body?.context;
    const level = body?.level;
    const message = body?.message;

    // ---- Validate required fields

    // Defence-in-depth check even though validate() already enforces the
    // schema — guards against unexpected middleware tampering.
    if (!level || !message || !body) throw new ValidationError('Invalid request body');

    // ---- Sanitise context with traceId

    // Deep-clone the context via JSON round-trip to strip any non-serialisable
    // data (e.g. circular references, Symbols), then inject the traceId so
    // every log entry is traceable end-to-end.
    const sanitizedContextJson = body?.context
      ? JSON.parse(JSON.stringify({ ...context, traceId }))
      : { traceId };

    // ---- Persist log entry

    const savedLog = await createLogs({
      data: {
        type: level,
        message: message as string,
        content: sanitizedContextJson,
        isBackend: true,
      },
    });

    // ---- Log success & respond

    return success(
      res,
      { data: { id: savedLog.id, traceId }, message: 'Successfully log to server' },
      201,
    );
  }),
];

// ---------------------------------------------------------------------------
// POST /api/logs/batch
// Ingest multiple log entries in a single batch request.
// Security: Public — no auth required; rate-limited at the proxy level.
// ---------------------------------------------------------------------------

export const postLogBatch: RequestHandler[] = [
  // ---- Validate input

  validate({ body: LogBatchSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    const { logs } = req.body!;

    // ---- Persist batch

    // Map each client-side log entry into the Prisma-compatible shape,
    // sanitising context with the request's traceId for end-to-end
    // traceability. The non-null assertion on req.body is intentional —
    // validation middleware guarantees the body matches LogBatchSchema.
    await createLogsBatch({
      data: logs.map((l: any) => ({
        type: l.level,
        message: l.message,
        content: JSON.parse(JSON.stringify({ ...l.context, traceId })) as Prisma.InputJsonValue,
        isBackend: false,
      })),
    });

    // ---- Log success & respond

    return success(res, { data: null, message: 'Logs ingested successfully' }, 201);
  }),
];
