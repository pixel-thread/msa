import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for creating a verification code. */
type Props = {
  /** The data to create the verification code with. */
  data: Prisma.VerificationCodeCreateInput;
};

// ---- Service ----

/** Persist a new verification code (e.g. OTP) for flows such as MFA setup, sign-in MFA, or password reset. */
export async function createVerificationCode(props: Props) {
  return await prisma.verificationCode.create(props);
}
