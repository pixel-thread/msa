// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response, type RequestHandler } from 'express';
import z from 'zod';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { pageNumberValidation } from '@src/shared/validators/common';
import { logger } from '@src/shared/logger';
import { auth } from '@src/middleware/auth';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole, UserStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import { getMembers } from '@src/features/members/services/getMembers';

// ---------------------------------------------------------------------------
// Schema — validate query parameters when listing members
// ---------------------------------------------------------------------------
const QuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(UserStatus).optional(),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/members  —  Paginated / filtered / searched member list
// Security: requires SECRETARY role
// Business intent: allow authorised officers to browse all members in their
//   association, optionally narrowed by status or a free-text search.
// ---------------------------------------------------------------------------
export const listMembers: RequestHandler[] = [
  auth,
  validate({ query: QuerySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ── Auth ────────────────────────────────────────────────────────────────
    const userId: string = (req.userId as string) || '';
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
    logger.info({ traceId, associationId: association.id }, 'GET /api/members - Request started');

    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId, userId: user.id }, 'GET /api/members - User authorized');

    // ── Business logic — build filters & fetch ──────────────────────────────
    const query = req.query as unknown as z.infer<typeof QuerySchema>;
    const page = query?.page;
    const status = query?.status;
    const search = query?.search;

    const baseWhere: Record<string, unknown> = {
      associationId: association.id,
    };
    if (status) baseWhere.status = status;

    let members;
    if (search) {
      members = await getMembers({ where: baseWhere, search, page });
    } else if (!hasHighRoleAccess(user.role)) {
      // Non-high-role users should only see ACTIVE members for privacy
      members = await getMembers({ where: { ...baseWhere, status: 'ACTIVE' }, page });
    } else {
      members = await getMembers({ where: baseWhere, page });
    }

    // ── Result log & response ───────────────────────────────────────────────
    logger.info({ traceId, count: members.data.length }, 'GET /api/members - Success');

    return success(res, { data: members.data, meta: members.pagination });
  }),
];
