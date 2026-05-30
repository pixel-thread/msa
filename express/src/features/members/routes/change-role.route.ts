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
  ConflictError,
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
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Body: the role to add or remove. */
const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

/** Route param: the member whose roles are being changed. */
const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

// ---------------------------------------------------------------------------
// POST /api/members/:memberId/role  —  Add a role to a member
// Security: requires PRESIDENT role
// Business intent: grant additional privileges (e.g. SECRETARY, FINANCE) to a
//   member who already holds a base role.
// ---------------------------------------------------------------------------
export const addRole: RequestHandler[] = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
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
      'POST /api/members/[memberId]/role - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, userId: user.id },
      'POST /api/members/[memberId]/role - User authorized',
    );

    // ── Business logic — verify target & add role ───────────────────────────
    const params = req.params as z.infer<typeof UpdateUserRoleParamsSchema>;

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });
    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;
    const body = req.body as z.infer<typeof UpdateUserRoleSchema>;
    const newRole = body?.role as UserRole;

    // Idempotency guard: reject if the member already has this role
    if (userRole.includes(newRole)) {
      throw new ConflictError('User already has the role');
    }

    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: [...userRole, newRole] },
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, memberId: params?.memberId, newRole },
      'POST /api/members/[memberId]/role - Success',
    );

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  }),
];

// ---------------------------------------------------------------------------
// PUT /api/members/:memberId/role  —  Remove a role from a member
// Security: requires PRESIDENT role
// Business intent: revoke an additional privilege without affecting the
//   member's other roles.
// ---------------------------------------------------------------------------
export const removeRole: RequestHandler[] = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
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
      'PUT /api/members/[memberId]/role - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info({ traceId, userId: user.id }, 'PUT /api/members/[memberId]/role - User authorized');

    // ── Business logic — verify target & remove role ────────────────────────
    const params = req.params as z.infer<typeof UpdateUserRoleParamsSchema>;

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });
    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;
    const body = req.body as z.infer<typeof UpdateUserRoleSchema>;
    const removeRoleVal = body?.role as UserRole;

    // Safety guard: prevent removing a role the member does not hold
    if (!userRole.includes(removeRoleVal)) {
      throw new ConflictError('User does not have the role');
    }

    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: userRole.filter((role) => role !== removeRoleVal) },
    });

    // ── Result log & response ───────────────────────────────────────────────
    logger.info(
      { traceId, memberId: params?.memberId, removeRole: removeRoleVal },
      'PUT /api/members/[memberId]/role - Success',
    );

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  }),
];
