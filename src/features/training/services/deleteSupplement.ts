import 'server-only';
import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

interface DeleteSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
}

export async function deleteSupplement({
  associationId,
  moduleId,
  supplementId,
  actorId,
}: DeleteSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
      include: { file: true },
    });

    if (!supplement) {
      throw new Error('Training supplement not found');
    }

    const storageKey = supplement.file?.storageKey;
    const fileId = supplement.fileId;

    await tx.trainingSupplement.delete({
      where: { id: supplementId },
    });

    if (fileId) {
      await tx.file.delete({ where: { id: fileId } });
    }

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
