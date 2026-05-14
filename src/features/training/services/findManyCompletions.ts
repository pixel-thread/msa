import { prisma } from "@lib/prisma";

interface FindManyCompletionsProps {
  associationId: string;
  moduleId?: string;
  userId?: string;
}

export async function findManyCompletions({ associationId, moduleId, userId }: FindManyCompletionsProps) {
  return await prisma.trainingCompletion.findMany({
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
  });
}
