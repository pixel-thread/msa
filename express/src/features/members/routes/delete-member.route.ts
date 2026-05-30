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
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@src/shared/errors';
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
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';

// ---------------------------------------------------------------------------
// Schema — route param identifying the member to soft-delete
// ---------------------------------------------------------------------------
const ParamSchema = z.object({ memberId: z.uuid() });

// ---------------------------------------------------------------------------
// DELETE /api/members/:memberId  —  Soft-delete a member
// Security: requires SECRETARY role
// Business intent: remove a member from active view without permanently
//   destroying their record, so data can be restored if needed.
// ---------------------------------------------------------------------------
export const deleteMember: RequestHandler[] = [
  validate({ params: ParamSchema }),
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
      'DELETE /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.SECRETARY);

    // ── Business logic — verify target & soft-delete ────────────────────────
    const params = req.params as z.infer<typeof ParamSchema>;

    const target = await findUniqueMember({ where: { id: params.memberId } });
    if (!target) throw new NotFoundError('Member not found');

    // Cross-association guard: prevent deleting a member from another assoc
    if (target.associationId !== association.id) {
      throw new BadRequestError('Member does not belong to this association');
    }

    await prisma.user.update({
      where: { id: params.memberId },
      data: { deletedAt: new Date() },
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, memberId: params.memberId }, 'DELETE /api/members/[memberId] - Success');

    return success(res, { data: null, message: 'Member deleted successfully' });
  }),
];
