// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { UpdateTrainingModuleInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for updating a training module. */
interface UpdateModuleProps {
  associationId: string;
  moduleId: string;
  actorId: string;
  data: UpdateTrainingModuleInput;
}

// ---- Service ----

/**
 * Update a training module with old/new value audit logging.
 *
 * Business intent: Track what changed in the module for compliance purposes.
 */
export async function updateModule({ associationId, moduleId, actorId, data }: UpdateModuleProps) {
  return await prisma.$transaction(async (tx) => {
    // Fetch the old record before mutation (for audit diff)
    const oldModule = await tx.trainingModule.findUniqueOrThrow({
      where: { id: moduleId, associationId },
    });

    // Apply the update
    const updatedModule = await tx.trainingModule.update({
      where: { id: moduleId, associationId },
      data,
    });

    // Audit log with before/after values
    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_UPDATE,
        resourceType: 'TrainingModule',
        resourceId: moduleId,
        oldValues: oldModule as unknown as Prisma.InputJsonValue,
        newValues: updatedModule as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedModule;
  });
}
