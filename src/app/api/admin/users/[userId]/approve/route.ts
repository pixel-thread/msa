import { UserRole } from "@prisma/client";
import { findUniqueMemberType } from "@src/features/member-type";
import { updateUser } from "@src/features/user/services";
import {
  AdminUserApproveParamsSchema,
  AdminUserApproveSchema,
} from "@src/features/user/validators";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { NotFoundError } from "@src/shared/errors";
import { getUniqueUser } from "@src/shared/services/user/getUniqueUser";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withValidation(
  { params: AdminUserApproveParamsSchema, body: AdminUserApproveSchema },
  async (req, _ctx, { params, body }) => {
    const userId = params?.userId;

    const memberTypeId = body?.memberTypeId;

    await withRole(req, UserRole.SECRETARY);

    if (!userId) {
      throw new NotFoundError("User not found");
    }
    const user = await getUniqueUser({
      where: { id: userId },
    });

    if (!user) throw new NotFoundError("User not found");

    const memberType = await findUniqueMemberType({
      memberTypeId: memberTypeId || "",
      associationId: user?.associationId,
    });

    if (!memberType) throw new NotFoundError("Member type not found");

    if (!user || user.status === "ACTIVE") {
      throw new NotFoundError("User does not exist or may have been accepted");
    }

    const updatedUser = await updateUser({
      where: { id: user.id, associationId: user.associationId },
      data: {
        status: "ACTIVE",
        memberType: { connect: { id: memberTypeId } },
        dateOfJoiningGovt: body?.dateOfJoiningGovt,
        dateOfJoiningMfsa: body?.dateOfJoiningMfsa,
      },
    });

    return SuccessResponse({ data: updatedUser });
  },
);
