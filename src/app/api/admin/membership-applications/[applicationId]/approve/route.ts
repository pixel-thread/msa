import { UserRole } from '@prisma/client';
import { approveMembershipApplication } from '@src/features/membership-applications/services';
import {
  ApproveApplicationSchema,
  MembershipApplicationParamsSchema,
} from '@src/features/membership-applications/validators';
import { withValidation, withRole } from '@src/shared/api';
import { NotFoundError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const POST = withValidation(
  { params: MembershipApplicationParamsSchema, body: ApproveApplicationSchema },
  async (req, _ctx, { params, body, traceId }) => {
    logger.info(
      { traceId, applicationId: params?.applicationId },
      'POST /api/admin/membership-applications/[applicationId]/approve - Request started',
    );

    const applicationId = params?.applicationId;

    if (!applicationId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/approve - Application not found (missing params)',
      );
      throw new NotFoundError('Application not found');
    }

    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/approve - User authorized',
    );

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/approve - User not found (missing x-user-id header)',
      );
      throw new NotFoundError('User not found');
    }

    const result = await approveMembershipApplication({
      applicationId,
      memberTypeId: body!.memberTypeId,
      role: body!.role,
      dateOfJoiningGovt: body!.dateOfJoiningGovt,
      reviewedBy: userId,
    });

    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/approve - Success',
    );

    return SuccessResponse({
      message: 'Application approved successfully. User account has been created.',
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
