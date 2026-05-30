// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { UpdateSupplementInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for updating a training supplement. */
interface UpdateSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
  data: UpdateSupplementInput;
  downloadUrl?: string;
  fileId?: string;
}

// ---- Service ----

/**
 * Update a training supplement, optionally replacing the file, with audit logging.
 *
 * Business intent: When a new file is uploaded, the old file record is cleaned up
 * and the storageKey is returned so the caller can delete the old blob from storage.
 */
export async function updateSupplement({
  associationId,
  moduleId,
  supplementId,
  actorId,
  data,
  downloadUrl,
  fileId,
}: UpdateSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    // Fetch existing supplement with its file info
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!supplement) {
      throw new Error('Training supplement not found');
    }

    // Capture old file info before mutation (needed for cleanup)
    const oldStorageKey = supplement.file?.storageKey;
    const oldFileId = supplement.fileId;

    // Apply the update
    const updated = await tx.trainingSupplement.update({
      where: { id: supplementId },
      data: {
        ...data,
        ...(downloadUrl && { downloadUrl }),
        ...(fileId && { fileId }),
      },
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
        resourceType: 'TrainingSupplement',
        resourceId: supplementId,
        oldValues: supplement as unknown as Prisma.InputJsonValue,
        newValues: updated as unknown as Prisma.InputJsonValue,
      },
    });

    return { supplement: updated, oldStorageKey };
  });
}
