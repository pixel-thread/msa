import { UserRole } from '@prisma/client';
import { rejectMembershipApplication } from '@src/features/membership-applications/services';
import {
  MembershipApplicationParamsSchema,
  RejectApplicationSchema,
} from '@src/features/membership-applications/validators';
import { withValidation, withRole } from '@src/shared/api';
import { NotFoundError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { params: MembershipApplicationParamsSchema, body: RejectApplicationSchema },
  async (req, _ctx, { params, body, traceId }) => {
    logger.info(
      { traceId, applicationId: params?.applicationId },
      'POST /api/admin/membership-applications/[applicationId]/reject - Request started',
    );

    const applicationId = params?.applicationId;

    if (!applicationId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/reject - Application not found (missing params)',
      );
      throw new NotFoundError('Application not found');
    }

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/reject - User authorized',
    );

    const userId = req.headers.get('x-user-id');

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/reject - User not found (missing x-user-id header)',
      );
      throw new NotFoundError('User not found');
    }

    const application = await rejectMembershipApplication({
      applicationId,
      rejectionReason: body!.rejectionReason,
      reviewedBy: userId,
    });

    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/reject - Success',
    );

    return SuccessResponse({
      message: 'Application rejected successfully.',
      data: {
        id: application.id,
        status: application.status,
        rejectionReason: application.rejectionReason,
        reviewedAt: application.reviewedAt,
      },
    });
  },
);
