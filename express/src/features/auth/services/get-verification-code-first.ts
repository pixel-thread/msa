import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for fetching the first matching verification code. */
type Props = {
  /** The filter criteria. */
  where: Prisma.VerificationCodeWhereInput;
  /** Optional sort order. */
  orderBy?: Prisma.VerificationCodeOrderByWithRelationInput;
};

/** Find the first verification code matching the given criteria. */
export async function getVerificationCodeFirst(props: Props) {
  return await prisma.verificationCode.findFirst(props);
}
