import { UserRole } from "@prisma/client";
import { getUser } from "@src/features/user/services";
import {
  AdminGetUserParamsSchema,
  AdminGetUserQuerySchema,
} from "@src/features/user/validators";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation(
  { query: AdminGetUserQuerySchema, params: AdminGetUserParamsSchema },
  async (association, { query, params }, req) => {
    await withRole(req, UserRole.SECRETARY);
    const status = query?.status || "ACTIVE";
    const userId = params?.userId;
    if (!userId) throw new NotFoundError("User not found");

    const users = await getUser({
      id: userId,
      associationId: association.id,
      status: status,
    });

    return SuccessResponse({ data: users });
  },
);
