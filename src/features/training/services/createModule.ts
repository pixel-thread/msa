import { prisma } from "@lib/prisma";
import { CreateTrainingModuleInput } from "../validators/training";
import { AuditAction, Prisma, UserRole } from "@prisma/client";

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
        newValues: data as Prisma.InputJsonValue,
      },
    });

    const targetRoles = data.requiredForRoles || [UserRole.MEMBER];
    
    if (targetRoles.length > 0) {
      const usersToAssign = await tx.user.findMany({
        where: {
          associationId,
          status: "ACTIVE",
          role: { hasSome: targetRoles },
        },
        select: { id: true },
      });

      if (usersToAssign.length > 0) {
        await tx.trainingAssignment.createMany({
          data: usersToAssign.map((user) => ({
            moduleId: module.id,
            userId: user.id,
            assignedById: actorId,
            status: "ASSIGNED",
          })),
        });
      }
    }

    return module;
  });
}
