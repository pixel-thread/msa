import { UserRole } from "@prisma/client";
import { getUsers } from "@src/features/user/services";
import { AdminGetUserQuerySchema } from "@src/features/user/validators";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation(
  { query: AdminGetUserQuerySchema },
  async (association, { query }, req) => {
    await withRole(req, UserRole.SECRETARY);
    const status = query?.status || "ACTIVE";
    const users = await getUsers({
      where: {
        associationId: association.id,
        status: status,
      },
    });

    return SuccessResponse({ data: users });
  },
);
