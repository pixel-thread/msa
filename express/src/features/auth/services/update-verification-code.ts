import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for updating a verification code. */
type Props = {
  /** The unique identifier of the code to update. */
  where: Prisma.VerificationCodeWhereUniqueInput;
  /** The data to update. */
  data: Prisma.VerificationCodeUpdateInput;
};

/** Update a verification code in the database. */
export async function updateVerificationCode(props: Props) {
  return await prisma.verificationCode.update(props);
}
