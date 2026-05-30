// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for deleting a training certificate. */
interface DeleteCertificateProps {
  associationId: string;
  moduleId: string;
  certificateId: string;
  actorId: string;
}

// ---- Service ----

/**
 * Delete a training certificate and its associated file with audit logging.
 *
 * Business intent: Also returns the storageKey so the caller can delete from Supabase.
 */
export async function deleteCertificate({
  associationId,
  moduleId,
  certificateId,
  actorId,
}: DeleteCertificateProps) {
  return await prisma.$transaction(async (tx) => {
    // Fetch certificate with its file info before deletion
    const certificate = await tx.trainingCertificate.findFirst({
      where: { id: certificateId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!certificate) {
      throw new Error('Training certificate not found');
    }

    const storageKey = certificate.file?.storageKey;
    const fileId = certificate.fileId;

    // Delete the certificate record
    await tx.trainingCertificate.delete({
      where: { id: certificateId },
    });

    // Clean up the file record
    if (fileId) {
      await tx.file.delete({ where: { id: fileId } });
    }

    // Audit the deletion
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
