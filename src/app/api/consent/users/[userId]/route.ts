import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { ConsentService } from "@src/features/consent";
import { z } from "zod";

const UserParamsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const GET = withAssociation(
  { params: UserParamsSchema },
  async (association, { params }, request) => {
    await withRole(request, UserRole.DPO);
    if (!params) throw new BadRequestError("Invalid user ID");

    const records = await ConsentService.getUserConsentHistoryById(
      params.userId,
      association.id,
    );

    if (records.length === 0) {
      throw new NotFoundError("No consent records found for this user");
    }

    return SuccessResponse({ data: records });
  },
);
