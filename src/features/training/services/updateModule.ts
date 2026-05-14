import { prisma } from "@lib/prisma";
import { UpdateTrainingModuleInput } from "../validators/training";
import { AuditAction } from "@prisma/client";

interface UpdateModuleProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  data: UpdateTrainingModuleInput;
}

export async function updateModule({ associationId, moduleId, actorId, data }: UpdateModuleProps) {
  return await prisma.$transaction(async (tx) => {
    const oldModule = await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    const updatedModule = await tx.trainingModule.update({
      where: { id: moduleId, associationId },
      data,
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: "TrainingModule",
        resourceId: moduleId,
        oldValues: oldModule as any,
        newValues: updatedModule as any,
      },
    });

    return updatedModule;
  });
}
