import 'server-only';
import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

interface DeleteCertificateProps {
  associationId: string;
  moduleId: string;
  certificateId: string;
  actorId: string;
}

export async function deleteCertificate({
  associationId,
  moduleId,
  certificateId,
  actorId,
}: DeleteCertificateProps) {
  return await prisma.$transaction(async (tx) => {
    const certificate = await tx.trainingCertificate.findFirst({
      where: { id: certificateId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!certificate) {
      throw new Error('Training certificate not found');
    }

    const storageKey = certificate.file?.storageKey;
    const fileId = certificate.fileId;

    await tx.trainingCertificate.delete({
      where: { id: certificateId },
    });

    if (fileId) {
      await tx.file.delete({ where: { id: fileId } });
    }

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingCertificate',
        resourceId: certificateId,
        oldValues: certificate as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Training certificate deleted',
      storageKey,
    };
  });
}
