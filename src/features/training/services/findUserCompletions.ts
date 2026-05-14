import { prisma } from "@lib/prisma";

interface FindUserCompletionsProps {
  userId: string;
  associationId: string;
}

export async function findUserCompletions({ userId, associationId }: FindUserCompletionsProps) {
  return await prisma.trainingCompletion.findMany({
    where: {
      userId,
      module: { associationId },
    },
    include: {
      module: true,
    },
    orderBy: { completedAt: "desc" },
  });
}
