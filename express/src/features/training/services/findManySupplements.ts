// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for finding supplements. */
interface FindManySupplementsProps {
  associationId: string;
  moduleId: string;
}

// ---- Service ----

/** Retrieve all supplements for a module, ordered by sort order ascending. */
export async function findManySupplements({ associationId, moduleId }: FindManySupplementsProps) {
  return await prisma.trainingSupplement.findMany({
    where: {
      moduleId,
      module: { associationId },
    },
    orderBy: { sortOrder: 'asc' },
  });
}
