import { UserRole } from '@prisma/client';
import { withAssociation, withRole } from '@src/shared/api';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { SuccessResponse } from '@src/shared/utils';
import { env } from '@src/env';
import { AddAssociationMemberSchema } from '@src/features/associations/validators/associations';
import { logger } from '@src/shared/logger/server';

export const POST = withAssociation(
  { body: AddAssociationMemberSchema },
  async (_, { body, traceId }, req) => {
    logger.info(
      {
        traceId,
        targetUserId: body?.user_id,
        targetAssociationId: body?.association_id,
      },
      'POST /api/admin/associations/[id]/member - Request started',
    );

    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations/[id]/member - User authorized',
    );

    const [targetUser, association] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: body?.user_id as string,
        },
      }),

      prisma.association.findUnique({
        where: {
          id: body?.association_id as string,
        },
      }),
    ]);

    if (!targetUser) {
      logger.error(
        { traceId, targetUserId: body?.user_id },
        'POST /api/admin/associations/[id]/member - User not found',
      );
      throw new NotFoundError('User not found');
    }

    if (!association) {
      logger.error(
        { traceId, targetAssociationId: body?.association_id },
        'POST /api/admin/associations/[id]/member - Association not found',
      );
      throw new NotFoundError('Association not found');
    }

    if (body?.association_id === targetUser.associationId) {
      logger.error(
        {
          traceId,
          targetUserId: body?.user_id,
          associationId: body?.association_id,
        },
        'POST /api/admin/associations/[id]/member - User already under the target association',
      );
      throw new ConflictError('User already under the target association');
    }

    const updatedUser = await prisma.user.update({
      where: { id: body?.user_id as string },
      data: {
        association: { connect: { id: body?.association_id as string } },
      },
      select: {
        id: true,
        role: true,
        associationId: true,
        email: true,
        name: true,
      },
    });

    if (env.NODE_ENV === 'production') {
      // TODO: Sent email for association change
      // Notify president of high role user that new user join the association
    }

    logger.info(
      {
        traceId,
        targetUserId: body?.user_id,
        associationId: body?.association_id,
      },
      'POST /api/admin/associations/[id]/member - Success',
    );

    return SuccessResponse({
      data: updatedUser,
      message: 'User association change successfully',
    });
  },
);
