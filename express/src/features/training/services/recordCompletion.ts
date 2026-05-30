import { prisma } from '@lib/prisma';
import { RecordCompletionInput, AdminRecordCompletionInput } from '../validators/training';
import { AuditAction, Prisma } from '@prisma/client';

/** Parameters for recording a completion. */
interface RecordCompletionProps {
  associationId: string;
  userId: string;
  moduleId: string;
  data: RecordCompletionInput;
}

/** Record a training completion for the current user with audit logging. */
export async function recordCompletion({
  associationId,
  userId,
  moduleId,
  data,
}: RecordCompletionProps) {
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
        resourceType: 'TrainingCompletion',
        resourceId: completion.id,
        newValues: { ...data, moduleId } as Prisma.InputJsonValue,
      },
    });

    return completion;
  });
}

/** Parameters for admin recording a completion. */
interface AdminRecordCompletionProps {
  associationId: string;
  actorId: string;
  data: AdminRecordCompletionInput;
}

/** Admin-record a training completion for any user with audit logging. */
export async function adminRecordCompletion({
  associationId,
  actorId,
  data,
}: AdminRecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
    const { userId, moduleId, scorePercent } = data;

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
      },
      update: {
        scorePercent,
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_COMPLETE,
        resourceType: 'TrainingCompletion',
        resourceId: completion.id,
        newValues: { userId, moduleId, scorePercent } as Prisma.InputJsonValue,
      },
    });

    return completion;
  });
}
