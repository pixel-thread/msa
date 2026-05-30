import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { z } from 'zod';

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

import { verifyPassword } from '@src/shared/lib/password';

import { BadRequestError, UnauthorizedError } from '@src/shared/errors';

import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';

/** Schema for disabling MFA — requires the user's current password. */
const DisableMfaSchema = z.object({ password: z.string().min(1, 'Password is required') });

/**
 * POST /api/auth/mfa/disable — Disable MFA for the authenticated user
 * Auth: auth middleware required
 *
 * Verifies the user's current password, confirms MFA is currently enabled,
 * then disables it. This is a sensitive operation that requires re-entry of
 * the password to prevent unauthorized disabling.
 */
export const postMfaDisable: RequestHandler[] = [
  validate({ body: DisableMfaSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
    logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Request started');
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { password } = req.body;

    // ---- Fetch user and check MFA status ----
    const user = await findFirstMember({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) throw new BadRequestError('MFA is not enabled');
    if (!user.password) throw new BadRequestError('Please set a password first');

    // Verify the user's password before allowing MFA to be disabled
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) throw new UnauthorizedError('Invalid password');

    // ---- Disable MFA ----
    await updateMember({ where: { id: userId }, data: { mfaEnabled: false } });

    logger.info({ traceId, userId }, 'POST /api/auth/mfa/disable - Success');
    return success(res, { message: 'MFA disabled successfully', data: { mfaEnabled: false } });
  }),
];
