// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for finding a certificate template. */
interface FindCertificateTemplateProps {
  associationId: string;
  moduleId: string;
}

// ---- Service ----

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
