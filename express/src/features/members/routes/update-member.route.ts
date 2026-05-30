import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { updateMember } from '@src/features/members/services/updateMember';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import z from 'zod';

/** Schema for validating the route parameter containing the member ID. */
const ParamSchema = z.object({ memberId: z.uuid() });

/** Schema for validating the request body when an admin updates a member. */
const AdminOnboardingSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  mobile: z
    .string()
    .min(10, 'Mobile must be 10 digits')
    .max(10, 'Mobile must be 10 digits')
    .regex(/^[0-9]+$/, 'Mobile should contain only numbers')
    .optional(),
  designation: z.string().optional(),
  dateOfJoiningGovt: z.coerce.date().optional(),
  dateOfJoiningAssociation: z.coerce.date().optional(),
  membershipNumber: z.string().optional(),
  associationId: z.uuid(),
});

/** Route handler for updating a member's profile. Requires SECRETARY role. */
export const updateMemberRoute: RequestHandler[] = [
  validate({ body: AdminOnboardingSchema, params: ParamSchema }),
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
      'PATCH /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId, userId: user.id }, 'PATCH /api/members/[memberId] - User authorized');

    const body = req.body as z.infer<typeof AdminOnboardingSchema>;
    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const params = req.params as z.infer<typeof ParamSchema>;
    const memberId = params.memberId;

    const updatedUser = await updateMember({
      where: { id: memberId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.mobile && { mobile: body.mobile }),
        ...(body.designation && { designation: body.designation }),
        ...(body.dateOfJoiningGovt && { dateOfJoiningGovt: body.dateOfJoiningGovt }),
        ...(body.dateOfJoiningAssociation && {
          dateOfJoiningAssociation: body.dateOfJoiningAssociation,
        }),
        ...(body.membershipNumber && { membershipNumber: body.membershipNumber }),
        ...(body.associationId && { associationId: body.associationId }),
      },
    });

    logger.info({ traceId, memberId }, 'PATCH /api/members/[memberId] - Success');

    return success(res, {
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        designation: updatedUser.designation,
        membershipNumber: updatedUser.membershipNumber,
        dateOfJoiningGovt: updatedUser.dateOfJoiningGovt,
        dateOfJoiningAssociation: updatedUser.dateOfJoiningAssociation,
      },
    });
  },
];
