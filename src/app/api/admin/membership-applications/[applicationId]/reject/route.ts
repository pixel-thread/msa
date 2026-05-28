import { UserRole } from "@prisma/client";
import { rejectMembershipApplication } from "@src/features/membership-applications/services";
import {
  MembershipApplicationParamsSchema,
  RejectApplicationSchema,
} from "@src/features/membership-applications/validators";
import { withValidation, withRole } from "@src/shared/api";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

export const POST = withValidation(
  { params: MembershipApplicationParamsSchema, body: RejectApplicationSchema },
  async (req, _ctx, { params, body, traceId }) => {
    logger.info("POST /api/admin/membership-applications/[applicationId]/reject - Request started", { traceId, applicationId: params?.applicationId });

    const applicationId = params?.applicationId;

    if (!applicationId) {
      logger.error("POST /api/admin/membership-applications/[applicationId]/reject - Application not found (missing params)", { traceId });
      throw new NotFoundError("Application not found");
    }

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info("POST /api/admin/membership-applications/[applicationId]/reject - User authorized", { traceId, userId: user.id, roles: user.role });

    const userId = req.headers.get("x-user-id");

    if (!userId) {
      logger.error("POST /api/admin/membership-applications/[applicationId]/reject - User not found (missing x-user-id header)", { traceId });
      throw new NotFoundError("User not found");
    }

    const application = await rejectMembershipApplication({
      applicationId,
      rejectionReason: body!.rejectionReason,
      reviewedBy: userId,
    });

    logger.info("POST /api/admin/membership-applications/[applicationId]/reject - Success", { traceId, applicationId });

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
