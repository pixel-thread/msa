import { withValidation } from '@src/shared/api';
import { ValidationError } from '@src/shared/errors';
import { createLogs } from '@src/shared/services/logs';
import { SuccessResponse } from '@src/shared/utils';
import { LogIngestSchema } from '@src/shared/validators/logs';
// import { logger } from "@src/shared/logger/server";

export const POST = withValidation(
  { body: LogIngestSchema.strict() },
  async (_req, _ctx, { body, traceId }) => {
    // logger.info({ traceId }, "POST /api/logs - Request started");

    const context = body?.context;

    const level = body?.level;

    const message = body?.message;

    if (!level || !message || !body) {
      throw new ValidationError('Invalid request body');
    }

    const sanitizedContextJson = body?.context
      ? JSON.parse(JSON.stringify({ ...context, traceId }))
      : { traceId };

    const savedLog = await createLogs({
      data: {
        type: level,
        message: message,
        content: sanitizedContextJson,
        isBackend: true,
      },
    });

    // logger.info({ traceId, logId: savedLog.id }, "POST /api/logs - Success");

    return SuccessResponse(
      {
        data: { id: savedLog.id, traceId },
        message: 'Successfully log to server',
      },
      201,
    );
  },
);
