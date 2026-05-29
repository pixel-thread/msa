import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.VerificationCodeWhereUniqueInput;
  data: Prisma.VerificationCodeUpdateInput;
};

export async function updateVerificationCode(props: Props) {
  return await prisma.verificationCode.update(props);
}
