// ---- Shared utilities ----
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

// ---- Interfaces ----

/** Parameters for finding user completions. */
interface FindUserCompletionsProps {
  userId: string;
  associationId: string;
  page?: number;
}

// ---- Service ----

/** Retrieve paginated training completions for a specific user (used on "My Completions" page). */
export async function findUserCompletions({
  userId,

  associationId,
  page = 1,
}: FindUserCompletionsProps) {
  const [trainingModule, total] = await prisma.$transaction([
    prisma.trainingCompletion.findMany({
      where: {
        userId,
        module: { associationId },
      },
      include: {
        module: true,
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { completedAt: 'desc' },
    }),

    prisma.trainingCompletion.count({
      where: {
        userId,
        module: { associationId },
      },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  return {
    pagination: buildPagination(total, page),
    module: trainingModule,
  };
}
