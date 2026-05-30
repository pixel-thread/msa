import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';
import z from 'zod';

const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

export const addRole = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    const association = { id: user.association.id, slug: user.association.slug, name: user.association.name };

    logger.info({ traceId, associationId: association.id }, 'POST /api/members/[memberId]/role - Request started');

    if (!user.role.includes(UserRole.PRESIDENT)) throw new ForbiddenError('Insufficient permissions');

    logger.info({ traceId, userId: user.id }, 'POST /api/members/[memberId]/role - User authorized');

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

    logger.info({ traceId, memberId: params?.memberId, newRole }, 'POST /api/members/[memberId]/role - Success');

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  },
];

export const removeRole = [
  validate({ body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    const association = { id: user.association.id, slug: user.association.slug, name: user.association.name };

    logger.info({ traceId, associationId: association.id }, 'PUT /api/members/[memberId]/role - Request started');

    if (!user.role.includes(UserRole.PRESIDENT)) throw new ForbiddenError('Insufficient permissions');

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

    logger.info({ traceId, memberId: params?.memberId, removeRole: removeRoleVal }, 'PUT /api/members/[memberId]/role - Success');

    return success(res, { data: updatedUser, message: 'User role updated successfully' });
  },
];
