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
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { findFirstMember } from '@src/features/members/services/findFirstMember';

// ---------------------------------------------------------------------------
// Schema — route param identifying the member to fetch
// ---------------------------------------------------------------------------
const ParamSchema = z.object({ memberId: z.uuid() });

// ---------------------------------------------------------------------------
// GET /api/members/:memberId  —  Full member profile including attendance
// Security: requires DPO role
// Business intent: provide a detailed view of a single member's profile data
//   plus a count of meetings they have attended for oversight purposes.
// ---------------------------------------------------------------------------
export const getMember: RequestHandler[] = [
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
      'GET /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    logger.info({ traceId, userId: user.id }, 'GET /api/members/[memberId] - User authorized');

    // ── Business logic — fetch full member profile ──────────────────────────
    const params = req.params as z.infer<typeof ParamSchema>;

    const member = await findFirstMember({
      where: { id: params.memberId, associationId: association.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        designation: true,
        mobile: true,
        dateOfJoiningGovt: true,
        dateOfJoiningAssociation: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            meetingAttendances: true,
          },
        },
      },
    });

    if (!member || member.id !== params.memberId) {
      throw new NotFoundError('Member not found');
    }

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, memberId: params.memberId }, 'GET /api/members/[memberId] - Success');

    return success(res, { data: member });
  }),
];
