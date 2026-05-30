import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';
import { z } from 'zod';

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

export const onboarding: RequestHandler[] = [
  validate({ body: OnboardingSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    const association = {
      id: user.association.id,
      slug: user.association.slug,
      name: user.association.name,
    };

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/members/onboarding - Request started',
    );

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const body = req.body as z.infer<typeof OnboardingSchema>;
    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const updatedUser = await updateMember({
      where: { id: userId },
      data: {
        dateOfJoiningGovt: new Date(body.dateOfJoiningGovt),
        dateOfJoiningAssociation: new Date(body.dateOfJoiningAssociation),
        mobile: body.mobile,
        designation: body.designation,
      },
    });

    logger.info({ traceId, userId: user.id }, 'POST /api/members/onboarding - Success');

    return success(res, {
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        designation: updatedUser.designation,
        mobile: updatedUser.mobile,
        dateOfJoiningGovt: updatedUser.dateOfJoiningGovt,
        dateOfJoiningAssociation: updatedUser.dateOfJoiningAssociation,
      },
      message: 'Onboarding completed successfully',
    });
  },
];
