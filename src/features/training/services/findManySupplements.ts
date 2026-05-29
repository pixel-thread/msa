import 'server-only';
import { prisma } from '@lib/prisma';

interface FindManySupplementsProps {
  associationId: string;
  moduleId: string;
}

export async function findManySupplements({ associationId, moduleId }: FindManySupplementsProps) {
  return await prisma.trainingSupplement.findMany({
    where: {
      moduleId,
      module: { associationId },
    },
    orderBy: { sortOrder: 'asc' },
  });
}
