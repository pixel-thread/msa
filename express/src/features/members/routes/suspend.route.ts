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
import { updateMember } from '@src/features/members/services/updateMember';

// ---------------------------------------------------------------------------
// Schema — route param identifying the member to suspend
// ---------------------------------------------------------------------------
const SuspenseUserRouteParams = z.object({
  memberId: z.uuid(),
});

// ---------------------------------------------------------------------------
// POST /api/members/:memberId/suspend  —  Suspend a member's account
// Security: requires PRESIDENT role
// Business intent: allow the association president to immediately disable a
//   member's access when a serious policy violation has been identified.
// ---------------------------------------------------------------------------
export const suspendMember: RequestHandler[] = [
  validate({ params: SuspenseUserRouteParams }),
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
      'POST /api/members/[memberId]/suspend - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, userId: user.id },
      'POST /api/members/[memberId]/suspend - User authorized',
    );

    // ── Business logic — verify target & suspend ────────────────────────────
    const params = req.params as z.infer<typeof SuspenseUserRouteParams>;

    const target = await findUniqueMember({ where: { id: params?.memberId } });
    if (!target) {
      throw new NotFoundError('Member not found');
    }

    // Cross-association guard: prevent suspending a member from another assoc
    if (target.associationId !== association.id) {
      throw new BadRequestError('Member does not belong to this association');
    }

    const updatedMember = await updateMember({
      where: { id: params?.memberId },
      data: { status: 'SUSPENDED' },
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, memberId: params?.memberId },
      'POST /api/members/[memberId]/suspend - Success',
    );

    return success(res, { data: updatedMember, message: 'Member suspended successfully' });
  }),
];
