import 'server-only';
import { prisma } from '@lib/prisma';

interface FindUniqueModuleProps {
  associationId: string;
  moduleId: string;
}

export async function findUniqueModule({ associationId, moduleId }: FindUniqueModuleProps) {
  return await prisma.trainingModule.findUnique({
    where: { id: moduleId, associationId },
    include: {
      certificateTemplate: {
        select: { id: true, certificateUrl: true, name: true },
      },
    },
  });
}
