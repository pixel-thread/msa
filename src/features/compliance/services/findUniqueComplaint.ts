import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.ComplaintWhereInput;
};

export async function findUniqueComplaint({ where }: Props) {
  return await prisma.complaint.findFirst({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
