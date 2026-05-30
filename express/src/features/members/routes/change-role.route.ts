import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { withRole } from '@src/shared/utils/with-role';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';
import z from 'zod';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for validating the request body when updating a user's role. */
const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

/** Schema for validating route parameters containing the member ID. */
const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

/** Route handler for adding a role to a member. Requires PRESIDENT role. */
export const addRole: RequestHandler[] = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
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
      'POST /api/members/[memberId]/role - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, userId: user.id },
      'POST /api/members/[memberId]/role - User authorized',
    );

    const params = req.params as z.infer<typeof UpdateUserRoleParamsSchema>;

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;
    const body = req.body as z.infer<typeof UpdateUserRoleSchema>;
    const newRole = body?.role as UserRole;

    if (userRole.includes(newRole)) {
      throw new ConflictError('User already has the role');
    }

    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: [...userRole, newRole] },
    });

    logger.info(
      { traceId, memberId: params?.memberId, newRole },
      'POST /api/members/[memberId]/role - Success',
    );

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  }),
];

/** Route handler for removing a role from a member. Requires PRESIDENT role. */
export const removeRole: RequestHandler[] = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
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
      'PUT /api/members/[memberId]/role - Request started',
    );

    await withRole(req, UserRole.PRESIDENT);

    logger.info({ traceId, userId: user.id }, 'PUT /api/members/[memberId]/role - User authorized');

    const params = req.params as z.infer<typeof UpdateUserRoleParamsSchema>;

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;
    const body = req.body as z.infer<typeof UpdateUserRoleSchema>;
    const removeRoleVal = body?.role as UserRole;

    if (!userRole.includes(removeRoleVal)) {
      throw new ConflictError('User does not have the role');
    }

    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: userRole.filter((role) => role !== removeRoleVal) },
    });

    logger.info(
      { traceId, memberId: params?.memberId, removeRole: removeRoleVal },
      'PUT /api/members/[memberId]/role - Success',
    );

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  }),
];
