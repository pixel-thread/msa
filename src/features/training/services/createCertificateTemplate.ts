import 'server-only';
import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';
import { NotFoundError } from '@src/shared/errors';

interface CreateCertificateTemplateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  name: string;
  certificateUrl: string;
  thumbnailUrl?: string;
  fileId?: string;
}

/**
 * Creates or replaces a certificate template for a training module.
 *
 * If a template already exists for this module, the old one is deleted
 * (including its File record) before creating the new one.
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
    const mod = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!mod) {
      throw new NotFoundError('Training module not found');
    }

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
        resourceType: 'TrainingCertificateTemplate',
        resourceId: template.id,
        newValues: { moduleId, name } as Prisma.InputJsonValue,
      },
    });

    await tx.trainingModule.update({
      where: { id: moduleId },
      data: { certificateTemplateId: template.id },
    });

    return template;
  });
}
