import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";
import { getMembers } from "@src/features/members/services/getMembers";
import z from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

const QuerySchema = z.object({
  page: z.coerce.number().positive().max(100).optional().default(1).catch(1),
});
export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    const page = query?.page;

    let members;
    if (!hasHighRoleAccess(user.role)) {
      members = await getMembers({
        where: { associationId: association.id, status: "ACTIVE" },
        page,
      });
    } else {
      members = await getMembers({
        where: { associationId: association.id },
        page,
      });
    }

    return SuccessResponse({
      data: members.data,
      meta: members.pagination,
    });
  },
);
