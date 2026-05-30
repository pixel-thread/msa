// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import z from 'zod';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { updateMember } from '@src/features/members/services/updateMember';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Route param: the member being updated. */
const ParamSchema = z.object({ memberId: z.uuid() });

/** Request body: fields an admin / secretary may change on a member profile. */
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

// ---------------------------------------------------------------------------
// PATCH /api/members/:memberId  —  Update a member's profile fields
// Security: requires SECRETARY role
// Business intent: allow secretary-level users to correct or fill in profile
//   data for any member in their association.
// ---------------------------------------------------------------------------
export const updateMemberRoute: RequestHandler[] = [
  validate({ body: AdminOnboardingSchema, params: ParamSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
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

    // ── Auth log ────────────────────────────────────────────────────────────
    logger.info(
      { traceId, associationId: association.id },
      'PATCH /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId, userId: user.id }, 'PATCH /api/members/[memberId] - User authorized');

    // ── Validate body & params ──────────────────────────────────────────────
    const body = req.body as z.infer<typeof AdminOnboardingSchema>;
    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const params = req.params as z.infer<typeof ParamSchema>;
    const memberId = params.memberId;

    // ── Business logic — update only provided fields ────────────────────────
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

    // ── Result log & response ───────────────────────────────────────────────
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
  }),
];
