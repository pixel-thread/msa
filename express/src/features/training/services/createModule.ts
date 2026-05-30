// ---- External libs ----
import { AuditAction, Prisma, UserRole } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';

// ---- Validators ----
import { CreateTrainingModuleInput } from '../validators/training';

// ---- Interfaces ----

/** Parameters for creating a training module. */
interface CreateModuleProps {
  associationId: string;
  actorId: string;
  data: CreateTrainingModuleInput;
}

// ---- Service ----

/**
 * Create a training module with audit logging and auto-assignment to matching users.
 *
 * Business intent: When a new training module is created, users whose roles match
 * the requiredForRoles list are automatically assigned so they can start training.
 */
export async function createModule({ associationId, actorId, data }: CreateModuleProps) {
  return await prisma.$transaction(async (tx) => {
    // Create the training module record
    const trainingModule = await tx.trainingModule.create({
      data: {
        associationId,
        ...data,
      },
    });

    // Audit log the creation
    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_MODULE_CREATE,
        resourceType: 'TrainingModule',
        resourceId: trainingModule.id,
        newValues: data as Prisma.InputJsonValue,
      },
    });

    // Auto-assign to users whose roles match the required roles
    const targetRoles = data.requiredForRoles || [UserRole.MEMBER];

    if (targetRoles.length > 0) {
      const usersToAssign = await tx.user.findMany({
        where: {
          associationId,
          status: 'ACTIVE',
          role: { hasSome: targetRoles },
        },
        select: { id: true },
      });

      if (usersToAssign.length > 0) {
        await tx.trainingAssignment.createMany({
          data: usersToAssign.map((user) => ({
            moduleId: trainingModule.id,
            userId: user.id,
            assignedById: actorId,
            status: 'ASSIGNED',
          })),
        });
      }
    }

    return trainingModule;
  });
}
