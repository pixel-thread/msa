import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { verifyPassword, generateOTP, hashToken } from '@src/shared/lib/password';
import { sendVerificationEmail } from '@src/shared/lib/email';
import { env } from '@src/env';
import { z } from 'zod';
import { BadRequestError, ConflictError, UnauthorizedError, ValidationError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { createVerificationCode } from '@src/features/auth/services/create-verification-code';
import { logger } from '@src/shared/logger';

const SetupMfaSchema = z.object({ password: z.string().min(1, 'Password is required') });

export const postMfaSetup = [
  validate({ body: SetupMfaSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { password } = req.body;
    const user = await findFirstMember({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.password) throw new BadRequestError('Please set a password first');
    if (user.mfaEnabled) throw new ConflictError('MFA is already enabled');

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) throw new ValidationError('Invalid password');

    const otp = generateOTP(env.OTP_LENGTH);
    const hashedOTP = hashToken(otp);
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

    await createVerificationCode({
      data: { user: { connect: { id: userId } }, code: hashedOTP, type: 'SETUP_MFA', expiresAt: otpExpiry },
    });

    const authUser = await findFirstMember({ where: { id: userId }, select: { email: true } });

    if (authUser && env.NODE_ENV === 'production') await sendVerificationEmail(authUser.email, otp, 'SETUP_MFA');
    if (authUser && env.NODE_ENV === 'development') logger.debug({ otp }, 'OTP:');

    return success(res, { message: 'Verification code sent to your email', data: { pending: true, codeSent: true } });
  },
];
