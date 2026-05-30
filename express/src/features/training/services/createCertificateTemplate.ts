// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { NotFoundError } from '@src/shared/errors';
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

interface CreateCertificateTemplateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  name: string;
  certificateUrl: string;
  thumbnailUrl?: string;
  fileId?: string;
}

// ---- Service ----

/**
 * Creates or replaces a certificate template for a training module.
 *
 * Business intent: If a template already exists for this module, the old one is deleted
 * (including its File record) before creating the new one. This ensures there is
 * only ever one active template per module.
 *
 * Tenant-scoped by associationId. Requires DPO role (enforced by caller).
 */
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
    // Verify the module exists
    const mod = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!mod) {
      throw new NotFoundError('Training module not found');
    }

    // If a template already exists, delete it (cascades to file)
    if (mod.certificateTemplateId) {
      const old = await tx.trainingCertificateTemplate.findUnique({
        where: { id: mod.certificateTemplateId },
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

    // Create the new template
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

    // Audit the template creation
    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingCertificateTemplate',
        resourceId: template.id,
        newValues: { moduleId, name } as Prisma.InputJsonValue,
      },
    });

    // Link the template to the module
    await tx.trainingModule.update({
      where: { id: moduleId },
      data: { certificateTemplateId: template.id },
    });

    return template;
  });
}
