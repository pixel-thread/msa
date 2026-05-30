/**
 * @file Membership Applications Route Handlers
 * @description This file contains the request handlers for reviewing membership applications.
 * It provides functionality for listing, approving, and rejecting applications.
 */

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { UserRole } from '@prisma/client';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { NotFoundError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

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

/**
 * @description List membership applications with optional status filter and pagination.
 * @security SECRETARY role required.
 * @route GET /api/admin/membership-applications
 */
export const getMembershipApplicationsHandler: RequestHandler[] = [
  validate({ query: GetMembershipApplicationsQuerySchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info(
      { traceId, status: (req.query as any)?.status },
      'GET /api/admin/membership-applications - Request started',
    );

    // Enforce SECRETARY role — only secretaries may view applications
    const user = await withRole(req, UserRole.SECRETARY);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/membership-applications - User authorized',
    );

    // Build filter from query params; default to unfiltered when no status is provided
    const query = req.query as any;
    const status = query?.status;
    const page = query?.page || 1;
    const where = status ? { status } : {};

    const result = await getMembershipApplications({ where, page });

    logger.info(
      { traceId, count: result.data.length },
      'GET /api/admin/membership-applications - Success',
    );

    return success(res, {
      data: result.data,
      meta: result.pagination,
    });
  }),
];

/**
 * @description Approve a membership application and provision a user account.
 * @security SECRETARY role required.
 * @route POST /api/admin/membership-applications/:applicationId/approve
 */
export const postApproveApplication: RequestHandler[] = [
  validate({
    params: MembershipApplicationParamsSchema,
    body: ApproveApplicationSchema,
  }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const applicationId = req.params.applicationId as string;

    // Guard against missing application ID in params
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

    // Enforce SECRETARY role
    const user = await withRole(req, UserRole.SECRETARY);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/approve - User authorized',
    );

    // Reviewer identity comes from the x-user-id header
    const userId = req.userId as string;

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/approve - User not found (missing x-user-id header)',
      );

      throw new NotFoundError('User not found');
    }

    // Approve and create the user account
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

/**
 * @description Reject a membership application with a required reason.
 * @security SECRETARY role required.
 * @route POST /api/admin/membership-applications/:applicationId/reject
 */
export const postRejectApplication: RequestHandler[] = [
  validate({
    params: MembershipApplicationParamsSchema,
    body: RejectApplicationSchema,
  }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const applicationId = req.params.applicationId as string;

    // Guard against missing application ID in params
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

    // Enforce SECRETARY role
    const user = await withRole(req, UserRole.SECRETARY);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/membership-applications/[applicationId]/reject - User authorized',
    );

    // Reviewer identity comes from the x-user-id header
    const userId = req.userId as string;

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/admin/membership-applications/[applicationId]/reject - User not found (missing x-user-id header)',
      );

      throw new NotFoundError('User not found');
    }

    // Reject the application with the provided reason
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
