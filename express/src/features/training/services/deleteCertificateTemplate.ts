// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for deleting a certificate template. */
interface DeleteCertificateTemplateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
}

// ---- Service ----

/**
 * Removes the certificate template from a training module and cleans up
 * the associated File record.
 *
 * Business intent: After deletion, the module no longer has a template linked.
 * Returns the storageKey so the caller can delete from Supabase storage.
 *
 * Tenant-scoped by associationId. Requires DPO role (enforced by caller).
 */
export async function deleteCertificateTemplate({
  associationId,
  moduleId,
  actorId,
}: DeleteCertificateTemplateProps) {
  return await prisma.$transaction(async (tx) => {
    // Find the module and verify it has a template
    const mod = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!mod || !mod.certificateTemplateId) {
      throw new Error('No certificate template found');
    }

    // Fetch the template with its file info
    const template = await tx.trainingCertificateTemplate.findUnique({
      where: { id: mod.certificateTemplateId },
      include: { file: true },
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    const storageKey = template.file?.storageKey;
    const fileId = template.fileId;

    // Unlink the template from the module first
    await tx.trainingModule.update({
      where: { id: moduleId },
      data: { certificateTemplateId: null },
    });

    // Delete the template record
    await tx.trainingCertificateTemplate.delete({
      where: { id: template.id },
    });

    // Clean up the associated file record
    if (fileId) {
      await tx.file.delete({ where: { id: fileId } }).catch(() => {});
    }

    // Audit the deletion
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
