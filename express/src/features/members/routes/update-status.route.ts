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
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole, UserStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Body: which status to apply. */
const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

/** Route param: the member whose status is being changed. */
const UpdateUserStatusParamsSchema = z.object({
  memberId: z.uuid(),
});

// ---------------------------------------------------------------------------
// PATCH /api/members/:memberId/status  —  Change a member's status
// Security: requires PRESIDENT role
// Business intent: allow the president to activate, deactivate, or otherwise
//   update the membership status of any user in their association.
// ---------------------------------------------------------------------------
export const updateStatus: RequestHandler[] = [
  validate({ body: UpdateUserStatusSchema, params: UpdateUserStatusParamsSchema }),
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
      'PATCH /api/members/[memberId]/status - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, userId: user.id },
      'PATCH /api/members/[memberId]/status - User authorized',
    );

    // ── Validate params ─────────────────────────────────────────────────────
    const params = req.params as z.infer<typeof UpdateUserStatusParamsSchema>;
    const memberId = params.memberId;
    if (!memberId) throw new UnauthorizedError('Unauthorized');

    // ── Business logic — verify target exists in assoc, then update status ──
    const target = await findFirstMember({
      where: { id: memberId, associationId: association.id },
    });
    if (!target) throw new NotFoundError('User does not exist in the association');

    const body = req.body as z.infer<typeof UpdateUserStatusSchema>;
    const updatedUser = await updateMember({
      where: { id: memberId },
      data: { status: body?.status },
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, memberId, status: body?.status },
      'PATCH /api/members/[memberId]/status - Success',
    );

    return success(res, { data: updatedUser, message: 'User status updated successfully' });
  }),
];
