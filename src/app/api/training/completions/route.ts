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

const GetAllCompletionsQuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: GetAllCompletionsQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.SECRETARY);

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

    return SuccessResponse({
      data: data.completions,
      meta: data.pagination,
    });
  },
);

export const POST = withAssociation(
  { body: AdminRecordCompletionSchema },
  async (association, { body }, request) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const admin = await withRole(request, UserRole.SECRETARY);

    const completion = await adminRecordCompletion({
      associationId: association.id,
      actorId: admin.id,
      data: body,
    });

    return SuccessResponse({ data: completion }, 201);
  },
);
