import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { env } from '@src/env';
import { ConflictError } from '@src/shared/errors';
import {
  MembershipApplicationInput,
  MembershipApplicationSchema,
} from '@src/features/membership-applications/validators';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { createMembershipApplication } from '@src/features/membership-applications/services';
import { logger } from '@src/shared/logger';

export const postSignUp = [
  validate({ body: MembershipApplicationSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
      logger.info({ traceId, email: req.body?.email }, 'POST /api/auth/sign-up - Request started');
      const {
        email, phone, associationSlug, firstName, lastName, dateOfBirth, age,
        gender, address, city, state, country, postalCode,
      } = req.body as MembershipApplicationInput;

      const [association, user] = await Promise.all([
        findFirstAssociation({
          where: { slug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG },
          select: { id: true, name: true },
        }),
        findFirstMember({ where: { email } }),
      ]);

      if (!association) {
        logger.error({ traceId, associationSlug }, 'POST /api/auth/sign-up - Association not found');
        throw new ConflictError('Association not found');
      }

      if (user && user.status === 'ACTIVE') {
        logger.error({ traceId, email }, 'POST /api/auth/sign-up - Active User already exists');
        throw new ConflictError('An Active User already exist with this email');
      }

      const application = await createMembershipApplication({
        email, phone, associationSlug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG,
        firstName, lastName, dateOfBirth: new Date(dateOfBirth), age,
        gender, address, city, state, country, postalCode,
      });

      logger.info({ traceId, applicationId: application.id }, 'POST /api/auth/sign-up - Success');

      return success(res, {
        message: 'Application submitted successfully. Your membership request is pending approval.',
        data: { id: application.id, email: application.email, status: application.status, createdAt: application.createdAt },
      }, 201);
  },
];
