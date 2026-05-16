import { prisma } from "@lib/prisma";
import { RecordCompletionInput, AdminRecordCompletionInput } from "../validators/training";
import { AuditAction, Prisma } from "@prisma/client";

interface RecordCompletionProps {
  associationId: string;
  userId: string;
  moduleId: string;
  data: RecordCompletionInput;
}

export async function recordCompletion({ associationId, userId, moduleId, data }: RecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
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

interface AdminRecordCompletionProps {
  associationId: string;
  actorId: string;
  data: AdminRecordCompletionInput;
}

export async function adminRecordCompletion({ associationId, actorId, data }: AdminRecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
    const { userId, moduleId, scorePercent, certificateUrl } = data;

    await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    await tx.user.findUniqueOrThrow({
      where: { id: userId, associationId },
    });

    const completion = await tx.trainingCompletion.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        scorePercent,
        certificateUrl,
      },
      update: {
        scorePercent,
        certificateUrl,
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_COMPLETE,
        resourceType: "TrainingCompletion",
        resourceId: completion.id,
        newValues: { userId, moduleId, scorePercent, certificateUrl } as Prisma.InputJsonValue,
      },
    });

    return completion;
  });
}
