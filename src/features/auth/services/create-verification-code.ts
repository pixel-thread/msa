import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  data: Prisma.VerificationCodeCreateInput;
};

export async function createVerificationCode(props: Props) {
  return await prisma.verificationCode.create(props);
}
