import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.VerificationCodeWhereInput;
  orderBy?: Prisma.VerificationCodeOrderByWithRelationInput;
};

export async function getVerificationCodeFirst(props: Props) {
  return await prisma.verificationCode.findFirst(props);
}
