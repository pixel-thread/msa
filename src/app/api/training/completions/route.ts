import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManyCompletions,
  adminRecordCompletion,
} from "@feature/training/services";
import { AdminRecordCompletionSchema } from "@feature/training/validators/training";
import { pageNumberValidation } from "@src/shared/validators/common";
import z from "zod";
import { logger } from "@src/shared/logger";

const GetAllCompletionsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: GetAllCompletionsQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /training/completions - Request started", { traceId, associationId: association.id });

    await withRole(request, UserRole.SECRETARY);
    logger.info("GET /training/completions - User authorized", { traceId });

    const page = query?.page || 1;

    const { searchParams } = new URL(request.url);

    const moduleId = searchParams.get("moduleId") || undefined;

    const userId = searchParams.get("userId") || undefined;

    const data = await findManyCompletions({
      associationId: association.id,
      moduleId,
      userId,
      page,
    });

    logger.info("GET /training/completions - Success", { traceId });
    return SuccessResponse({
      data: data.completions,
      meta: data.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: AdminRecordCompletionSchema },
  async (association, { body, traceId }, request) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    logger.info("POST /training/completions - Request started", { traceId, associationId: association.id });

    const admin = await withRole(request, UserRole.SECRETARY);
    logger.info("POST /training/completions - User authorized", { traceId, userId: admin.id });

    const completion = await adminRecordCompletion({
      associationId: association.id,
      actorId: admin.id,
      data: body,
    });

    logger.info("POST /training/completions - Success", { traceId, completionId: completion.id });
    return SuccessResponse({ data: completion }, 201);
  },
);
