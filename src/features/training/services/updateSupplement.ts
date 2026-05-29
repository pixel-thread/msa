import 'server-only';
import { prisma } from '@lib/prisma';
import { UpdateSupplementInput } from '../validators/training';
import { AuditAction, Prisma } from '@prisma/client';

interface UpdateSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
  data: UpdateSupplementInput;
  downloadUrl?: string;
  fileId?: string;
}

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
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!supplement) {
      throw new Error('Training supplement not found');
    }

    const oldStorageKey = supplement.file?.storageKey;
    const oldFileId = supplement.fileId;

    const updated = await tx.trainingSupplement.update({
      where: { id: supplementId },
      data: {
        ...data,
        ...(downloadUrl && { downloadUrl }),
        ...(fileId && { fileId }),
      },
    });

    if (oldFileId && fileId && oldFileId !== fileId) {
      await tx.file.delete({ where: { id: oldFileId } });
    }

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
