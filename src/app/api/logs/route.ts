import { withValidation } from "@src/shared/api";
import { ValidationError } from "@src/shared/errors";
import { createLogs, getLogs } from "@src/shared/services/logs";
import { SuccessResponse } from "@src/shared/utils";
import { LogIngestSchema, LogQuerySchema } from "@src/shared/validators/logs";
import type { Log } from "@prisma/client";
import { logger } from "@src/shared/logger";

export const GET = withValidation(
  { query: LogQuerySchema },
  async (_req, _ctx, { query, traceId }) => {
    logger.info("GET /api/logs - Request started", { traceId });

    const {
      page,
      level,
      search,
      messageExact,
      contentSearch,
      startDate,
      endDate,
      isBackend,
      ids,
      sortBy,
      sortOrder,
      limit,
    } = query!;

    const where: Parameters<typeof getLogs>[0]["where"] = {};

    if (level) {
      const levels = Array.isArray(level) ? level : [level];
      where.type = levels.length === 1 ? levels[0] : { in: levels };
    }

    if (messageExact) {
      where.message = messageExact;
    } else if (search) {
      where.message = { contains: search, mode: "insensitive" };
    }

    if (contentSearch) {
      where.content = { string_contains: contentSearch };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (isBackend !== undefined) {
      where.isBackend = isBackend;
    }

    if (ids) {
      where.id = { in: ids.split(",").map((id) => id.trim()) };
    }

    const { logs, pagination } = await getLogs({
      where,
      page: page || 1,
      sortBy,
      sortOrder,
      limit,
    });

    logger.info("GET /api/logs - Success", { traceId, count: logs.length });

    return SuccessResponse<Log[]>({
      data: logs,
      meta: pagination,
      message: "Logs retrieved successfully",
    });
  },
);

export const POST = withValidation(
  { body: LogIngestSchema.strict() },
  async (_req, _ctx, { body, traceId }) => {
    logger.info("POST /api/logs - Request started", { traceId });

    const context = body?.context;

    const level = body?.level;

    const message = body?.message;

    if (!level || !message || !body) {
      throw new ValidationError("Invalid request body");
    }

    const sanitizedContextJson = body?.context
      ? JSON.parse(JSON.stringify(context))
      : {};

    const savedLog = await createLogs({
      data: {
        type: level,
        message: message,
        content: sanitizedContextJson,
        isBackend: true,
      },
    });

    logger.info("POST /api/logs - Success", { traceId, logId: savedLog.id });

    return SuccessResponse(
      { data: { id: savedLog.id }, message: "Successfully log to server" },
      201,
    );
  },
);
