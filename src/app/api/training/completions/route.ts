import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { findManyCompletions, adminRecordCompletion } from "@feature/training/services";
import { AdminRecordCompletionSchema } from "@feature/training/validators/training";

export const GET = withAssociation(
  {},
  async (association, _, request) => {
    await withRole(request, UserRole.SECRETARY);

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const completions = await findManyCompletions({
      associationId: association.id,
      moduleId,
      userId,
    });

    return SuccessResponse({ data: completions });
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
