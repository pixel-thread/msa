// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for finding a unique training module. */
interface FindUniqueModuleProps {
  associationId: string;
  moduleId: string;
}

// ---- Service ----

/** Find a single training module by ID within an association (includes certificate template). */
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
