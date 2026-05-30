import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { env } from '@src/env';

import { BadRequestError, ConflictError } from '@src/shared/errors';

import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { createMembershipApplication } from '@src/features/membership-applications/services';

import {
  MembershipApplicationInput,
  MembershipApplicationSchema,
} from '@src/features/membership-applications/validators';

/**
 * POST /api/auth/sign-up — Submit a membership application for a new account
 * Auth: none (public)
 *
 * Validates the membership application form, ensures the target association
 * exists, verifies no active user already exists with this email, and creates
 * a pending membership application for admin review and approval.
 */
export const postSignUp: RequestHandler[] = [
  validate({ body: MembershipApplicationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId, email: req.body?.email }, 'POST /api/auth/sign-up - Request started');

    // ---- Extract validated input ----
    const {
      email,
      phone,
      associationSlug,
      firstName,
      lastName,
      dateOfBirth,
      age,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body as MembershipApplicationInput;

    // ---- Validate association and check for existing user ----
    // Run both lookups in parallel since they are independent of each other
    const [association, user] = await Promise.all([
      findFirstAssociation({
        where: { slug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG },
        select: { id: true, name: true },
      }),
      findFirstMember({ where: { email } }),
    ]);

    // Reject if the association slug does not resolve to a valid association
    if (!association) {
      logger.error({ traceId, associationSlug }, 'POST /api/auth/sign-up - Association not found');
      throw new BadRequestError('Invalid association');
    }

    // Prevent duplicate active accounts for the same email address
    if (user && user.status === 'ACTIVE') {
      logger.error({ traceId, email }, 'POST /api/auth/sign-up - Active User already exists');
      throw new ConflictError('Active User already exists');
    }

    // ---- Create membership application ----
    const application = await createMembershipApplication({
      email,
      phone,
      associationSlug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      age,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
    });

    logger.info({ traceId, applicationId: application.id }, 'POST /api/auth/sign-up - Success');

    // ---- Respond with created application summary ----
    return success(
      res,
      {
        message: 'Application submitted successfully. Your membership request is pending approval.',
        data: {
          id: application.id,
          email: application.email,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      201,
    );
  }),
];
