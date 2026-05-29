import { UserRole } from '@prisma/client';
import { getUser, updateUser } from '@src/features/user/services';
import { UpdateUserSchema } from '@src/features/user/validators';
import { withValidation, withRole } from '@src/shared/api';
import { UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import { logger } from '@src/shared/logger/server';

export const GET = withValidation({}, async (req, _ctx, { traceId }) => {
  logger.info({ traceId }, 'GET /api/user - Request started');

  const userId = req.headers.get('x-user-id');

  if (!userId) throw new UnauthorizedError('User not found');

  const user = await getUser({ id: userId });

  if (!user) throw new UnauthorizedError('User not found');

  logger.info({ traceId, userId }, 'GET /api/user - Success');

  return SuccessResponse({
    data: user,
    message: 'User fetched successfully',
  });
});

export const POST = withValidation(
  { body: UpdateUserSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info({ traceId }, 'POST /api/user - Request started');

    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/user - User authorized',
    );

    const userId = req.headers.get('x-user-id');

    if (!userId) throw new UnauthorizedError('User not found');

    const existing = await getUser({ id: userId });

    if (!existing) throw new UnauthorizedError('User not found');

    const updatedUser = await updateUser({
      where: { id: userId },
      data: {
        name: body?.name,
        mobile: body?.mobile,
        designation: body?.designation,
        dateOfJoiningGovt: body?.dateOfJoiningGovt,
        dateOfJoiningAssociation: body?.dateOfJoiningAssociation,
      },
    });

    logger.info({ traceId, userId }, 'POST /api/user - Success');

    return SuccessResponse({
      data: updatedUser,
      message: 'User updated successfully',
    });
  },
);
