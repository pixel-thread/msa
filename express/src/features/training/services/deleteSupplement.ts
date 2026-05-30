// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Interfaces ----

/** Parameters for deleting a training supplement. */
interface DeleteSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
}

// ---- Service ----

/**
 * Delete a training supplement and its associated file with audit logging.
 *
 * Business intent: Also returns the storageKey so the caller can delete from Supabase.
 */
export async function deleteSupplement({
  associationId,
  moduleId,
  supplementId,
  actorId,
}: DeleteSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    // Fetch supplement with its file info before deletion
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!supplement) {
      throw new Error('Training supplement not found');
    }

    const storageKey = supplement.file?.storageKey;
    const fileId = supplement.fileId;

    // Delete the supplement (cascades to file record)
    await tx.trainingSupplement.delete({
      where: { id: supplementId },
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
        resourceType: 'TrainingSupplement',
        resourceId: supplementId,
        oldValues: supplement as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: 'Training supplement deleted',
      storageKey,
    };
  });
}
