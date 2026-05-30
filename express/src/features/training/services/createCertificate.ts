// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { CreateTrainingCertificateInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for creating a training certificate. */
interface CreateCertificateProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  data: CreateTrainingCertificateInput;
  certificateUrl: string;
  fileId?: string;
}

// ---- Service ----

/** Create a training certificate for a user with audit logging. */
export async function createCertificate({
  associationId,
  moduleId,
  actorId,
  data,
  certificateUrl,
  fileId,
}: CreateCertificateProps) {
  return await prisma.$transaction(async (tx) => {
    // Verify the module exists
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    // Create the certificate record
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

    // Audit the certificate creation
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
