import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

/** Props for fetching a single complaint. */
type Props = {
  /** Filter criteria to find the complaint. */
  where: Prisma.ComplaintWhereInput;
};

/** Find the first complaint matching the given criteria, including user details. */
export async function findUniqueComplaint({ where }: Props) {
  return await prisma.complaint.findFirst({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
