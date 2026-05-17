import { withValidation } from "@src/shared/api";
import { ValidationError } from "@src/shared/errors";
import { createLogs, getLogs } from "@src/shared/services/logs";
import { SuccessResponse } from "@src/shared/utils";
import { LogIngestSchema, LogQuerySchema } from "@src/shared/validators/logs";
import type { Log } from "@prisma/client";

export const GET = withValidation(
  { query: LogQuerySchema },
  async (_req, _ctx, { query }) => {
    const { page, limit, level, search, startDate, endDate, isBackend } =
      query!;

    const where: Parameters<typeof getLogs>[0]["where"] = {};

    if (level) {
      where.type = level;
    }

    if (search) {
      where.message = { contains: search, mode: "insensitive" };
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

    const { logs, pagination } = await getLogs({
      where,
      page: page || 1,
      pageSize: limit || 10,
    });

    return SuccessResponse<Log[]>({
      data: logs,
      meta: pagination,
      message: "Logs retrieved successfully",
    });
  },
);

export const POST = withValidation(
  { body: LogIngestSchema.strict() },
  async (_req, _ctx, { body }) => {
    // 2. Sanitize data through your internal PII stripper (safeStringify)
    // Then safely re-parse it so Prisma treats it as a structural JSON object
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
        type: level, // Maps to string 'type' column
        message: message, // Maps to string 'message' column
        content: sanitizedContextJson, // Maps to the JSON column block in Postgres
        isBackend: true,
      },
    });

    return SuccessResponse(
      { data: { id: savedLog.id }, message: "Successfully log to server" },
      201,
    );
  },
);
