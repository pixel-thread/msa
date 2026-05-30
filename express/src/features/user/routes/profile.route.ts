import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getUser, updateUser } from '@src/features/user/services';
import { withRole } from '@src/shared/utils/with-role';
import { UpdateUserSchema } from '@src/features/user/validators';
import { logger } from '@src/shared/logger';
import z from 'zod';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET handler to fetch the authenticated user's profile. */
export const getProfile: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'GET /api/user - Request started');

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('User not found');

    const user = await getUser({ id: userId });
    if (!user) throw new UnauthorizedError('User not found');

    logger.info({ traceId, userId }, 'GET /api/user - Success');

    return success(res, { data: user, message: 'User fetched successfully' });
  }),
];

/** POST handler to update the authenticated user's profile. */
export const updateProfile: RequestHandler[] = [
  validate({ body: UpdateUserSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/user - Request started');

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('User not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    await withRole(req, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'POST /api/user - User authorized');

    if (!userId) throw new UnauthorizedError('User not found');

    const existing = await getUser({ id: userId });
    if (!existing) throw new UnauthorizedError('User not found');

    const body = req.body as z.infer<typeof UpdateUserSchema>;
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

    return success(res, { data: updatedUser, message: 'User updated successfully' });
  }),
];
