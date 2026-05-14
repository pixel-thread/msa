import { prisma } from "@lib/prisma";

interface FindUserCompletionsProps {
  userId: string;
}

export async function findUserCompletions({ userId }: FindUserCompletionsProps) {
  return await prisma.trainingCompletion.findMany({
    where: { userId },
    include: {
      module: true,
    },
    orderBy: { completedAt: "desc" },
  });
}
