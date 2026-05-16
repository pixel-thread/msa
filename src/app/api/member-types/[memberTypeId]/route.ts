import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findUniqueMemberType,
  updateMemberType,
  deleteMemberType,
} from "@feature/member-type/services";
import {
  UpdateMemberTypeSchema,
  MemberTypeParamsSchema,
} from "@feature/member-type/validators";

export const GET = withAssociation(
  { params: MemberTypeParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new BadRequestError("Invalid member type ID");
    }

    await withRole(request, UserRole.MEMBER);

    const { memberTypeId } = params;

    const memberType = await findUniqueMemberType({
      associationId: association.id,
      memberTypeId,
    });

    if (!memberType) {
      throw new NotFoundError("Member type not found");
    }

    return SuccessResponse({ data: memberType, message: "Member type found" });
  },
);

export const PATCH = withAssociation(
  { params: MemberTypeParamsSchema, body: UpdateMemberTypeSchema },
  async (association, { params, body }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid member type ID");
    }

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.PRESIDENT);
    const { memberTypeId } = params;

    const memberType = await updateMemberType({
      associationId: association.id,
      actorId: user.id,
      memberTypeId,
      data: body,
    });

    return SuccessResponse({
      data: memberType,
      message: "Member type updated successfully",
    });
  },
);

export const DELETE = withAssociation(
  { params: MemberTypeParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid member type ID");
    }

    const user = await withRole(request, UserRole.PRESIDENT);
    const { memberTypeId } = params;

    await deleteMemberType({
      associationId: association.id,
      actorId: user.id,
      memberTypeId,
    });

    return SuccessResponse({
      data: null,
      message: "Member type deleted successfully",
    });
  },
);

