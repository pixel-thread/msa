import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

/** Props for fetching complaints with pagination. */
type Props = {
  /** Filter criteria. */
  where: Prisma.ComplaintWhereInput;
  /** Page number (defaults to 1). */
  page?: number;
};

/** Find complaints with pagination. Returns complaints and total count. */
export async function findManyComplaints({ where, page = 1 }: Props) {
  const skip = (page - 1) * PAGE_SIZE;
  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);
  return { complaints, total };
}
