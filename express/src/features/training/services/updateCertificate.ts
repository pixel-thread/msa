// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { UpdateTrainingCertificateInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for updating a training certificate. */
interface UpdateCertificateProps {
  associationId: string;
  moduleId: string;
  certificateId: string;
  actorId: string;
  data: UpdateTrainingCertificateInput;
  certificateUrl?: string;
  fileId?: string;
}

// ---- Service ----

/**
 * Update a training certificate, optionally replacing the file, with audit logging.
 *
 * Business intent: When a new certificate file is uploaded, the old file record
 * is cleaned up from the database and the old storage key is returned for
 * Supabase blob deletion.
 */
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
    // Fetch the existing certificate with its file info
    const certificate = await tx.trainingCertificate.findFirst({
      where: { id: certificateId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!certificate) {
      throw new Error('Training certificate not found');
    }

    // Capture old storage key for cleanup
    const oldStorageKey = certificate.file?.storageKey;
    const oldFileId = certificate.fileId;

    // Build the update payload
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

    // Apply the update
    const updated = await tx.trainingCertificate.update({
      where: { id: certificateId },
      data: updateData,
    });

    // Clean up the old file record if replaced
    if (oldFileId && fileId && oldFileId !== fileId) {
      await tx.file.delete({ where: { id: oldFileId } });
    }

    // Audit the update
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
