import { prisma } from "@lib/prisma";
import { buildPagination } from "@src/shared/utils/build-pagination";

interface FindManyCompletionsProps {
  associationId: string;
  moduleId?: string;
  userId?: string;
  page?: number;
}

export async function findManyCompletions({
  associationId,
  moduleId,
  userId,
  page = 1,
}: FindManyCompletionsProps) {
  const [trainingCompletions, total] = await prisma.$transaction([
    prisma.trainingCompletion.findMany({
      where: {
        module: { associationId },
        moduleId,
        userId,
      },
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
      orderBy: { completedAt: "desc" },
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
