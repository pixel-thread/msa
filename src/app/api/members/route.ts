import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole, UserStatus } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";
import { getMembers } from "@src/features/members/services/getMembers";
import z from "zod";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";
import { pageNumberValidation } from "@src/shared/validators/common";

const QuerySchema = z.object({
  page: pageNumberValidation,
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
});
export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query }, request) => {
    const user = await withRole(request, UserRole.SECRETARY);
    const page = query?.page;
    const status = query?.status;
    const search = query?.search;

    const baseWhere: Record<string, unknown> = { associationId: association.id };
    if (status) baseWhere.status = status;

    let members;
    if (search) {
      members = await getMembers({
        where: baseWhere,
        search,
        page,
      });
    } else if (!hasHighRoleAccess(user.role)) {
      members = await getMembers({
        where: { ...baseWhere, status: "ACTIVE" },
        page,
      });
    } else {
      members = await getMembers({
        where: baseWhere,
        page,
      });
    }

    return SuccessResponse({
      data: members.data,
      meta: members.pagination,
    });
  },
);
