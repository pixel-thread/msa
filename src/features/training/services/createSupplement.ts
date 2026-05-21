import { prisma } from "@lib/prisma";
import { CreateSupplementInput } from "../validators/training";
import { AuditAction, Prisma } from "@prisma/client";

interface CreateSupplementProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  data: CreateSupplementInput;
}

export async function createSupplement({ associationId, moduleId, actorId, data }: CreateSupplementProps) {
  return await prisma.$transaction(async (tx) => {
    const module = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!module) {
      throw new Error("Training module not found");
    }

    const supplement = await tx.trainingSupplement.create({
      data: {
        moduleId,
        ...data,
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: "TrainingSupplement",
        resourceId: supplement.id,
        newValues: data as Prisma.InputJsonValue,
      },
    });

    return supplement;
  });
}
