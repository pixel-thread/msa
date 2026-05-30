// External libs
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import z from 'zod';

// Shared utilities
import { asyncHandler } from '@src/shared/utils/async-handler';
import { success } from '@src/shared/utils/responses';
import { validate } from '@src/shared/lib/validate';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { withRole } from '@src/shared/utils/with-role';

// ---- Prisma

import { UserRole } from '@prisma/client';

// ---- Services

import { getUser, updateUser } from '@src/features/user/services';

// ---- Validators / Types

import { UpdateUserSchema } from '@src/features/user/validators';

// ---------------------------------------------------------------------------
// GET /api/user
// Return the authenticated user's own profile.
// Security: auth (applied at router level) — any authenticated user.
// ---------------------------------------------------------------------------

export const getProfile: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'GET /api/user - Request started');

    // ---- Authorize

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('User not found');

    // ---- Fetch user

    // Retrieve the user record; if it does not exist the session is invalid
    // or the user was deleted since authentication.
    const user = await getUser({ id: userId });
    if (!user) throw new UnauthorizedError('User not found');

    // ---- Log success & respond

    logger.info({ traceId, userId }, 'GET /api/user - Success');
    return success(res, { data: user, message: 'User fetched successfully' });
  }),
];

// ---------------------------------------------------------------------------
// POST /api/user
// Update the authenticated user's profile fields (name, mobile, designation,
// dates of joining).
// Security: auth (applied at router level) + MEMBER role.
// ---------------------------------------------------------------------------

export const updateProfile: RequestHandler[] = [
  // ---- Validate input

  validate({ body: UpdateUserSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // ---- Setup

    const traceId = (req.traceId as string) || '';
    logger.info({ traceId }, 'POST /api/user - Request started');

    // ---- Authorize

    const userId = req.userId as string;
    if (!userId) throw new UnauthorizedError('User not found');

    // ---- Load user + association

    // The association is required to verify the user belongs to an active
    // association before allowing profile updates.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');

    // ---- Authorize — require MEMBER role or higher

    await withRole(req, UserRole.MEMBER);

    // ---- Auth log

    logger.info({ traceId, userId: user.id }, 'POST /api/user - User authorized');

    // ---- Defence-in-depth

    if (!userId) throw new UnauthorizedError('User not found');

    // ---- Confirm user still exists

    // Re-fetch the user after role check to ensure the record has not been
    // deleted or deactivated during the async role verification.
    const existing = await getUser({ id: userId });
    if (!existing) throw new UnauthorizedError('User not found');

    // ---- Prepare update payload

    const body = req.body as z.infer<typeof UpdateUserSchema>;

    // ---- Persist update

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

    // ---- Log success & respond

    logger.info({ traceId, userId }, 'POST /api/user - Success');
    return success(res, { data: updatedUser, message: 'User updated successfully' });
  }),
];
