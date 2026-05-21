import { prisma } from "@lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

interface DeleteSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
}

export async function deleteSupplement({ associationId, moduleId, supplementId, actorId }: DeleteSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
    });

    if (!supplement) {
      throw new Error("Training supplement not found");
    }

    await tx.trainingSupplement.delete({
      where: { id: supplementId },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: "TrainingSupplement",
        resourceId: supplementId,
        oldValues: supplement as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true, message: "Training supplement deleted" };
  });
}
