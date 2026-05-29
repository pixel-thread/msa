import { withAssociation } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { UnauthorizedError, ValidationError } from '@src/shared/errors';
import { updateMember } from '@src/features/members/services/updateMember';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const OnboardingSchema = z.object({
  dateOfJoiningGovt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), 'Cannot be in the future'),
  dateOfJoiningAssociation: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), 'Cannot be in the future'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian mobile number required'),
  designation: z.string().min(2).max(100).trim(),
});

export const POST = withAssociation(
  { body: OnboardingSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/members/onboarding - Request started',
    );

    const userId = request.headers.get('x-user-id');

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const user = await updateMember({
      where: { id: userId },
      data: {
        dateOfJoiningGovt: new Date(body.dateOfJoiningGovt),
        dateOfJoiningAssociation: new Date(body.dateOfJoiningAssociation),
        mobile: body.mobile,
        designation: body.designation,
      },
    });

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/members/onboarding - Success',
    );

    return SuccessResponse({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        designation: user.designation,
        mobile: user.mobile,
        dateOfJoiningGovt: user.dateOfJoiningGovt,
        dateOfJoiningAssociation: user.dateOfJoiningAssociation,
      },
      message: 'Onboarding completed successfully',
    });
  },
);
