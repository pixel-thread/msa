import { UserRole } from "@prisma/client";
import { approveMembershipApplication } from "@src/features/membership-application/services";
import {
  ApproveApplicationSchema,
  MembershipApplicationParamsSchema,
} from "@src/features/membership-application/validators";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withValidation(
  { params: MembershipApplicationParamsSchema, body: ApproveApplicationSchema },
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

    const result = await approveMembershipApplication({
      applicationId,
      memberTypeId: body!.memberTypeId,
      role: body!.role,
      dateOfJoiningGovt: body!.dateOfJoiningGovt,
      reviewedBy: userId,
    });

    return SuccessResponse({
      message: "Application approved successfully. User account has been created.",
      data: {
        user: result.user,
        application: {
          id: result.application.id,
          status: result.application.status,
          reviewedAt: result.application.reviewedAt,
        },
        tempPassword: result.tempPassword,
      },
    });
  },
);
