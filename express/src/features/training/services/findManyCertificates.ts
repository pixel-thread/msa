import { prisma } from '@lib/prisma';

/** Parameters for finding certificates. */
interface FindManyCertificatesProps {
  associationId: string;
  moduleId: string;
}

/** Retrieve all certificates for a module, ordered by issue date descending. */
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
