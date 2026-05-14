import { prisma } from "@lib/prisma";
import { RecordCompletionInput } from "../validators/training";
import { AuditAction, Prisma } from "@prisma/client";

interface RecordCompletionProps {
  associationId: string;
  userId: string;
  moduleId: string;
  data: RecordCompletionInput;
}

export async function recordCompletion({ associationId, userId, moduleId, data }: RecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
    // Verify module exists and belongs to association
    await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    const completion = await tx.trainingCompletion.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        ...data,
      },
      update: {
        ...data,
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: userId,
        action: AuditAction.TRAINING_COMPLETE,
        resourceType: "TrainingCompletion",
        resourceId: completion.id,
        newValues: { ...data, moduleId } as Prisma.InputJsonValue,
      },
    });

    return completion;
  });
}
