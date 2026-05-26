import { prisma } from "@lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

interface CreateCertificateTemplateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  name: string;
  certificateUrl: string;
  thumbnailUrl?: string;
  fileId?: string;
}

export async function createCertificateTemplate({
  associationId,
  moduleId,
  actorId,
  name,
  certificateUrl,
  thumbnailUrl,
  fileId,
}: CreateCertificateTemplateProps) {
  return await prisma.$transaction(async (tx) => {
    const module = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!module) {
      throw new Error("Training module not found");
    }

    // Clean up existing template if present
    if (module.certificateTemplateId) {
      const old = await tx.trainingCertificateTemplate.findUnique({
        where: { id: module.certificateTemplateId },
        include: { file: true },
      });
      if (old) {
        await tx.trainingCertificateTemplate.delete({
          where: { id: old.id },
        });
        if (old.fileId) {
          await tx.file.delete({ where: { id: old.fileId } }).catch(() => {});
        }
      }
    }

    const template = await tx.trainingCertificateTemplate.create({
      data: {
        associationId,
        name,
        certificateUrl,
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(fileId && { fileId }),
        trainingModule: { connect: { id: moduleId } },
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: "TrainingCertificateTemplate",
        resourceId: template.id,
        newValues: { moduleId, name } as Prisma.InputJsonValue,
      },
    });

    // Update the module to link the template
    await tx.trainingModule.update({
      where: { id: moduleId },
      data: { certificateTemplateId: template.id },
    });

    return template;
  });
}
