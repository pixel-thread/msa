import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

/** Parameters for finding user assignments. */
interface FindUserAssignmentsProps {
  userId: string;
  associationId: string;
  page?: number;
}

/** Retrieve paginated training assignments for a specific user. */
export async function findUserAssignments({
  userId,
  associationId,
  page = 1,
}: FindUserAssignmentsProps) {
  const [assignments, total] = await prisma.$transaction([
    prisma.trainingAssignment.findMany({
      where: {
        userId,
        module: { associationId },
      },
      include: { module: true },
      orderBy: { assignedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),

    prisma.trainingAssignment.count({
      where: {
        userId,
        module: { associationId },
      },
    }),
  ]);

  return {
    assignments,
    pagination: buildPagination(total, page, PAGE_SIZE),
  };
}
