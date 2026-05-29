import 'server-only';
import { prisma } from '@lib/prisma';

interface FindManyCertificatesProps {
  associationId: string;
  moduleId: string;
}

export async function findManyCertificates({ associationId, moduleId }: FindManyCertificatesProps) {
  return await prisma.trainingCertificate.findMany({
    where: {
      moduleId,
      module: { associationId },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
  });
}
