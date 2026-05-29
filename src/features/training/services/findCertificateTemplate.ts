import 'server-only';
import { prisma } from '@lib/prisma';

interface FindCertificateTemplateProps {
  associationId: string;
  moduleId: string;
}

/**
 * Finds the certificate template linked to a training module.
 *
 * Scoped by associationId for multi-tenant isolation.
 */
export async function findCertificateTemplate({
  associationId,
  moduleId,
}: FindCertificateTemplateProps) {
  return await prisma.trainingCertificateTemplate.findFirst({
    where: {
      trainingModule: { id: moduleId, associationId },
    },
  });
}
