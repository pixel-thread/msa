import { UserRole } from "@prisma/client";
import { findUniqueMember } from "@src/features/members/services/findUniqueMember";
import { updateMember } from "@src/features/members/services/updateMember";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const SuspenseUserRouteParams = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { params: SuspenseUserRouteParams },
  async (association, { params }, req) => {
    await withRole(req, UserRole.SUPER_ADMIN);

    const user = await findUniqueMember({ where: { id: params?.memberId } });

    if (!user) {
      throw new NotFoundError("Member not found");
    }

    if (user.associationId !== association.id) {
      throw new BadRequestError("Member does not belong to this association");
    }
    const updatedMember = await updateMember({
      where: { id: params?.memberId },
      data: { status: "SUSPENDED" },
    });
    return SuccessResponse({ data: updatedMember,message:"Member suspended successfully" });
  },
);
