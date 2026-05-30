import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for updating a verification code. */
type Props = {
  /** The unique identifier of the code to update. */
  where: Prisma.VerificationCodeWhereUniqueInput;
  /** The data to update. */
  data: Prisma.VerificationCodeUpdateInput;
};

// ---- Service ----

/** Update a verification code — used to increment attempt counters and mark codes as used after successful OTP validation. */
export async function updateVerificationCode(props: Props) {
  return await prisma.verificationCode.update(props);
}
