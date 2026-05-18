import { prisma } from "@lib/prisma";
import { buildPagination } from "@src/shared/utils/build-pagination";

interface FindUserCompletionsProps {
  userId: string;
  associationId: string;
  page?: number;
  limit?: number;
}

export async function findUserCompletions({
  userId,

  associationId,
  page = 1,
  limit = 10,
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
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { completedAt: "desc" },
    }),

    prisma.trainingCompletion.count({
      where: {
        userId,
        module: { associationId },
      },
      orderBy: { completedAt: "desc" },
    }),
  ]);
  return {
    pagination: buildPagination(total, page, limit),
    module: trainingModule,
  };
}
