// ---- Shared utilities ----
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

// ---- Interfaces ----

/** Parameters for finding training completions. */
interface FindManyCompletionsProps {
  associationId: string;
  moduleId?: string;
  userId?: string;
  page?: number;
}

// ---- Service ----

/**
 * Retrieve paginated training completions with optional module and user filters.
 *
 * Business intent: Used by the admin completions view to search/filter completions.
 */
export async function findManyCompletions({
  associationId,
  moduleId,
  userId,
  page = 1,
}: FindManyCompletionsProps) {
  const skip = (page - 1) * PAGE_SIZE;

  const [trainingCompletions, total] = await prisma.$transaction([
    prisma.trainingCompletion.findMany({
      where: {
        module: { associationId },
        moduleId,
        userId,
      },
      skip,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    }),

    prisma.trainingCompletion.count({
      where: {
        module: { associationId },
        moduleId,
        userId,
      },
    }),
  ]);

  return {
    completions: trainingCompletions,
    pagination: buildPagination(total, page),
  };
}
