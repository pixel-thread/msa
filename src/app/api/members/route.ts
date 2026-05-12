import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { withRole } from "@src/shared/api/with-role";
import { getMembers } from "@src/features/members/services/getMembers";
import z from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().positive().max(100).optional().default(1).catch(1),
});
export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.MEMBER);
    const page = query?.page;

    const members = await getMembers({
      where: { associationId: association.id, status: "ACTIVE" },
      page,
    });

    return SuccessResponse({
      data: members.data,
      meta: members.pagination,
    });
  },
);
