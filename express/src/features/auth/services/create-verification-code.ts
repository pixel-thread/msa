import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for creating a verification code. */
type Props = {
  /** The data to create the verification code with. */
  data: Prisma.VerificationCodeCreateInput;
};

/** Create a new verification code in the database. */
export async function createVerificationCode(props: Props) {
  return await prisma.verificationCode.create(props);
}
