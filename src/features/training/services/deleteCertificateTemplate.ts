import 'server-only';
import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

interface DeleteCertificateTemplateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
}

/**
 * Removes the certificate template from a training module and cleans up
 * the associated File record.
 *
 * Tenant-scoped by associationId. Requires DPO role (enforced by caller).
 * Returns the storageKey so the caller can delete from Supabase storage.
 */
export async function deleteCertificateTemplate({
  associationId,
  moduleId,
  actorId,
}: DeleteCertificateTemplateProps) {
  return await prisma.$transaction(async (tx) => {
    const mod = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!mod || !mod.certificateTemplateId) {
      throw new Error('No certificate template found');
    }

    const template = await tx.trainingCertificateTemplate.findUnique({
      where: { id: mod.certificateTemplateId },
      include: { file: true },
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    const storageKey = template.file?.storageKey;
    const fileId = template.fileId;

    await tx.trainingModule.update({
      where: { id: moduleId },
      data: { certificateTemplateId: null },
    });

    await tx.trainingCertificateTemplate.delete({
      where: { id: template.id },
    });

    if (fileId) {
      await tx.file.delete({ where: { id: fileId } }).catch(() => {});
    }

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingCertificateTemplate',
        resourceId: template.id,
        oldValues: template as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true, storageKey };
  });
}
