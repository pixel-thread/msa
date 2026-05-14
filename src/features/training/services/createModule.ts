import { prisma } from "@lib/prisma";
import { CreateTrainingModuleInput } from "../validators/training";
import { AuditAction } from "@prisma/client";

interface CreateModuleProps {
  associationId: string;
  actorId: string;
  data: CreateTrainingModuleInput;
}

export async function createModule({ associationId, actorId, data }: CreateModuleProps) {
  return await prisma.$transaction(async (tx) => {
    const module = await tx.trainingModule.create({
      data: {
        associationId,
        ...data,
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_CREATE,
        resourceType: "TrainingModule",
        resourceId: module.id,
        newValues: data as any,
      },
    });

    return module;
  });
}
