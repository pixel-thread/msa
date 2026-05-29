import 'server-only';
import { prisma } from '@lib/prisma';
import { CreateTrainingCertificateInput } from '../validators/training';
import { AuditAction, Prisma } from '@prisma/client';

interface CreateCertificateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  data: CreateTrainingCertificateInput;
  certificateUrl: string;
  fileId?: string;
}

export async function createCertificate({
  associationId,
  moduleId,
  actorId,
  data,
  certificateUrl,
  fileId,
}: CreateCertificateProps) {
  return await prisma.$transaction(async (tx) => {
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    const certificate = await tx.trainingCertificate.create({
      data: {
        moduleId,
        userId: data.userId,
        certificateUrl,
        ...(data.certificateNumber && {
          certificateNumber: data.certificateNumber,
        }),
        ...(data.issuedAt && { issuedAt: new Date(data.issuedAt) }),
        ...(data.thumbnailUrl && { thumbnailUrl: data.thumbnailUrl }),
        ...(fileId && { fileId }),
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingCertificate',
        resourceId: certificate.id,
        newValues: { userId: data.userId, moduleId } as Prisma.InputJsonValue,
      },
    });

    return certificate;
  });
}
