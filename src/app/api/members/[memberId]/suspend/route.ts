import { UserRole } from "@prisma/client";
import { findUniqueMember } from "@src/features/members/services/findUniqueMember";
import { updateMember } from "@src/features/members/services/updateMember";
import { withAssociation, withRole } from "@src/shared/api";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { logger } from "@src/shared/logger";

const SuspenseUserRouteParams = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { params: SuspenseUserRouteParams },
  async (association, { params, traceId }, req) => {
    logger.info("POST /api/members/[memberId]/suspend - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info("POST /api/members/[memberId]/suspend - User authorized", {
      traceId,
      userId: user.id,
    });

    const target = await findUniqueMember({ where: { id: params?.memberId } });

    if (!target) {
      throw new NotFoundError("Member not found");
    }

    if (target.associationId !== association.id) {
      throw new BadRequestError("Member does not belong to this association");
    }
    const updatedMember = await updateMember({
      where: { id: params?.memberId },
      data: { status: "SUSPENDED" },
    });

    logger.info("POST /api/members/[memberId]/suspend - Success", {
      traceId,
      memberId: params?.memberId,
    });

    return SuccessResponse({ data: updatedMember,message:"Member suspended successfully" });
  },
);
