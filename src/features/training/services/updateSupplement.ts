import { prisma } from "@lib/prisma";
import { UpdateSupplementInput } from "../validators/training";
import { AuditAction, Prisma } from "@prisma/client";

interface UpdateSupplementProps {
  associationId: string;
  moduleId: string;
  supplementId: string;
  actorId: string;
  data: UpdateSupplementInput;
}

export async function updateSupplement({ associationId, moduleId, supplementId, actorId, data }: UpdateSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    const supplement = await tx.trainingSupplement.findFirst({
      where: { id: supplementId, moduleId, module: { associationId } },
    });

    if (!supplement) {
      throw new Error("Training supplement not found");
    }

    const updated = await tx.trainingSupplement.update({
      where: { id: supplementId },
      data,
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: "TrainingSupplement",
        resourceId: supplementId,
        oldValues: supplement as unknown as Prisma.InputJsonValue,
        newValues: updated as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}
