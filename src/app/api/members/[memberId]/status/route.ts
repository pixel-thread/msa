import { UserRole, UserStatus } from '@prisma/client';
import { withAssociation, withRole } from '@src/shared/api';
import { NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { SuccessResponse } from '@src/shared/utils';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const UpdateUserStatusSchema = z.object({
  status: z.enum(UserStatus),
});

const UpdateUserStatusParamsSchema = z.object({
  memberId: z.uuid(),
});

export const PATCH = withAssociation(
  { body: UpdateUserStatusSchema, params: UpdateUserStatusParamsSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'PATCH /api/members/[memberId]/status - Request started',
    );

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'PATCH /api/members/[memberId]/status - User authorized',
    );

    const memberId = params?.memberId;

    if (!memberId) throw new UnauthorizedError('Unauthorized');

    const target = await findFirstMember({
      where: { id: memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const updatedUser = await updateMember({
      where: { id: memberId },
      data: { status: body?.status },
    });

    logger.info(
      {
        traceId,
        memberId,
        status: body?.status,
      },
      'PATCH /api/members/[memberId]/status - Success',
    );

    return SuccessResponse({
      data: updatedUser,
      message: 'User status updated successfully',
    });
  },
);
