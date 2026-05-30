import { Prisma } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';

// ---- Types ----

/** Props for fetching the first matching verification code. */
type Props = {
  /** The filter criteria. */
  where: Prisma.VerificationCodeWhereInput;
  /** Optional sort order. */
  orderBy?: Prisma.VerificationCodeOrderByWithRelationInput;
};

// ---- Service ----

/** Find the most recent unused verification code matching criteria — used to validate OTPs for MFA and sign-in flows. */
export async function getVerificationCodeFirst(props: Props) {
  return await prisma.verificationCode.findFirst(props);
}
