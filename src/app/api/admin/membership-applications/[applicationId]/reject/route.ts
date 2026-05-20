import { UserRole } from "@prisma/client";
import { rejectMembershipApplication } from "@src/features/membership-application/services";
import {
  MembershipApplicationParamsSchema,
  RejectApplicationSchema,
} from "@src/features/membership-application/validators";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withValidation(
  { params: MembershipApplicationParamsSchema, body: RejectApplicationSchema },
  async (req, _ctx, { params, body }) => {
    const applicationId = params?.applicationId;

    if (!applicationId) {
      throw new NotFoundError("Application not found");
    }

    await withRole(req, UserRole.SECRETARY);

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      throw new NotFoundError("User not found");
    }

    const application = await rejectMembershipApplication({
      applicationId,
      rejectionReason: body!.rejectionReason,
      reviewedBy: userId,
    });

    return SuccessResponse({
      message: "Application rejected successfully.",
      data: {
        id: application.id,
        status: application.status,
        rejectionReason: application.rejectionReason,
        reviewedAt: application.reviewedAt,
      },
    });
  },
);
