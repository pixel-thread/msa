// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { RecordCompletionInput, AdminRecordCompletionInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for recording a completion (self-service). */
interface RecordCompletionProps {
  associationId: string;
  userId: string;
  moduleId: string;
  data: RecordCompletionInput;
}

/** Parameters for admin recording a completion. */
interface AdminRecordCompletionProps {
  associationId: string;
  actorId: string;
  data: AdminRecordCompletionInput;
}

// ---- Services ----

/**
 * Record a training completion for the current user with audit logging.
 *
 * Business intent: Users self-report completion of a training module.
 * Uses upsert so re-completion updates the timestamp rather than duplicating.
 */
export async function recordCompletion({
  associationId,
  userId,
  moduleId,
  data,
}: RecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
    // Verify the module exists in this association
    await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    // Upsert completion record (one completion per user per module)
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

    // Audit the completion
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

/**
 * Admin-record a training completion for any user with audit logging.
 *
 * Business intent: Secretaries/DPOs can record completions on behalf of members
 * who may not have digital access or who completed training offline.
 */
export async function adminRecordCompletion({
  associationId,
  actorId,
  data,
}: AdminRecordCompletionProps) {
  return await prisma.$transaction(async (tx) => {
    const { userId, moduleId, scorePercent } = data;

    // Verify module and user exist in this association
    await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    await tx.user.findUniqueOrThrow({
      where: { id: userId, associationId },
    });

    // Upsert completion
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

    // Audit the admin-recorded completion
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
