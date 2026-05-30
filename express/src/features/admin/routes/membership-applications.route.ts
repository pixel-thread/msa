import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import {
  getMembershipApplications,
  approveMembershipApplication,
  rejectMembershipApplication,
} from '@src/features/membership-applications/services';
import {
  GetMembershipApplicationsQuerySchema,
  MembershipApplicationParamsSchema,
  ApproveApplicationSchema,
  RejectApplicationSchema,
} from '@src/features/membership-applications/validators';
import { logger } from '@src/shared/logger';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /api/admin/membership-applications - List membership applications with optional status filter. */
export const getMembershipApplicationsHandler: RequestHandler[] = [
  validate({ query: GetMembershipApplicationsQuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, status: (req.query as any)?.status },
      'GET /api/admin/membership-applications - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/membership-applications - User authorized',
    );
    const query = req.query as any;
    const status = query?.status;
    const page = query?.page || 1;
    const where = status ? { status } : {};
    const result = await getMembershipApplications({ where, page });
    logger.info(
      { traceId, count: result.data.length },
      'GET /api/admin/membership-applications - Success',
    );
    return success(res, { data: result.data, meta: result.pagination });
  }),
];

/** POST /api/admin/membership-applications/:applicationId/approve - Approve a membership application and create a user. */
export const postApproveApplication: RequestHandler[] = [
  validate({ params: MembershipApplicationParamsSchema, body: ApproveApplicationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const applicationId = req.params.applicationId as string;
    if (!applicationId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/approve - Application not found (missing params)',
      );
      throw new NotFoundError('Application not found');
    }
    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/approve - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/approve - User authorized',
    );
    const userId = req.userId as string;
    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/approve - User not found (missing x-user-id header)',
      );
      throw new NotFoundError('User not found');
    }
    const result = await approveMembershipApplication({
      applicationId,
      memberTypeId: req.body!.memberTypeId,
      role: req.body!.role,
      dateOfJoiningGovt: req.body!.dateOfJoiningGovt,
      reviewedBy: userId,
    });
    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/approve - Success',
    );
    return success(res, {
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
  }),
];

/** POST /api/admin/membership-applications/:applicationId/reject - Reject a membership application with a reason. */
export const postRejectApplication: RequestHandler[] = [
  validate({ params: MembershipApplicationParamsSchema, body: RejectApplicationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const applicationId = req.params.applicationId as string;
    if (!applicationId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/reject - Application not found (missing params)',
      );
      throw new NotFoundError('Application not found');
    }
    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/reject - Request started',
    );
    const user = await withRole(req, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/reject - User authorized',
    );
    const userId = req.userId as string;
    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/reject - User not found (missing x-user-id header)',
      );
      throw new NotFoundError('User not found');
    }
    const application = await rejectMembershipApplication({
      applicationId,
      rejectionReason: req.body!.rejectionReason,
      reviewedBy: userId,
    });
    logger.info(
      { traceId, applicationId },
      'POST /api/admin/membership-applications/[applicationId]/reject - Success',
    );
    return success(res, {
      message: 'Application rejected successfully.',
      data: {
        id: application.id,
        status: application.status,
        rejectionReason: application.rejectionReason,
        reviewedAt: application.reviewedAt,
      },
    });
  }),
];
