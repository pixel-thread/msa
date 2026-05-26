import { prisma } from "@lib/prisma";

interface FindCertificateTemplateProps {
  associationId: string;
  moduleId: string;
}

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
