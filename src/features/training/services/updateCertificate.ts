import 'server-only';
import { prisma } from '@lib/prisma';
import { UpdateTrainingCertificateInput } from '../validators/training';
import { AuditAction, Prisma } from '@prisma/client';

interface UpdateCertificateProps {
  associationId: string;
  moduleId: string;
  certificateId: string;
  actorId: string;
  data: UpdateTrainingCertificateInput;
  certificateUrl?: string;
  fileId?: string;
}

export async function updateCertificate({
  associationId,
  moduleId,
  certificateId,
  actorId,
  data,
  certificateUrl,
  fileId,
}: UpdateCertificateProps) {
  return await prisma.$transaction(async (tx) => {
    const certificate = await tx.trainingCertificate.findFirst({
      where: { id: certificateId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!certificate) {
      throw new Error('Training certificate not found');
    }

    const oldStorageKey = certificate.file?.storageKey;
    const oldFileId = certificate.fileId;

    const updateData: Record<string, unknown> = {};

    if (data.certificateNumber !== undefined) {
      updateData.certificateNumber = data.certificateNumber;
    }
    if (data.issuedAt !== undefined) {
      updateData.issuedAt = new Date(data.issuedAt);
    }
    if (data.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = data.thumbnailUrl;
    }
    if (certificateUrl) {
      updateData.certificateUrl = certificateUrl;
    }
    if (fileId) {
      updateData.fileId = fileId;
    }
    if (data.issuedAt !== undefined) {
      updateData.issuedAt = new Date(data.issuedAt);
    }
    if (data.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = data.thumbnailUrl;
    }
    if (certificateUrl) {
      updateData.certificateUrl = certificateUrl;
    }
    if (fileId) {
      updateData.id = fileId;
    }

    const updated = await tx.trainingCertificate.update({
      where: { id: certificateId },
      data: updateData,
    });

    if (oldFileId && fileId && oldFileId !== fileId) {
      await tx.file.delete({ where: { id: oldFileId } });
    }

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingCertificate',
        resourceId: certificateId,
        oldValues: certificate as unknown as Prisma.InputJsonValue,
        newValues: updated as unknown as Prisma.InputJsonValue,
      },
    });

    return { certificate: updated, oldStorageKey };
  });
}
