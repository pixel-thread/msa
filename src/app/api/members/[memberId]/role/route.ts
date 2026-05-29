import { UserRole } from '@prisma/client';
import { withAssociation, withRole } from '@src/shared/api';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { SuccessResponse } from '@src/shared/utils';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const UpdateUserRoleSchema = z.object({
  role: z.enum(UserRole),
});

const UpdateUserRoleParamsSchema = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/members/[memberId]/role - Request started',
    );

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/members/[memberId]/role - User authorized',
    );

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;

    const newRole = body?.role as UserRole;

    if (userRole.includes(newRole)) {
      throw new ConflictError('User already has the role');
    }
    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: [...userRole, newRole] },
    });

    logger.info(
      {
        traceId,
        memberId: params?.memberId,
        newRole,
      },
      'POST /api/members/[memberId]/role - Success',
    );

    return SuccessResponse({
      data: updatedUser,
      message: 'User role updated successfully',
    });
  },
);

export const PUT = withAssociation(
  { body: UpdateUserRoleSchema, params: UpdateUserRoleParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'PUT /api/members/[memberId]/role - Request started',
    );

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'PUT /api/members/[memberId]/role - User authorized',
    );

    const target = await findFirstMember({
      where: { id: params?.memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const userRole = target.role;

    const removeRole = body?.role as UserRole;

    if (!userRole.includes(removeRole)) {
      throw new ConflictError('User does not have the role');
    }

    const updatedUser = await updateMember({
      where: { id: params?.memberId },
      data: { role: userRole.filter((role) => role !== removeRole) },
    });

    logger.info(
      {
        traceId,
        memberId: params?.memberId,
        removeRole,
      },
      'PUT /api/members/[memberId]/role - Success',
    );

    return SuccessResponse({
      data: updatedUser,
      message: 'User role updated successfully',
    });
  },
);
