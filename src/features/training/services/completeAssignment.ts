import { prisma } from "@lib/prisma";
import { AuditAction, Prisma, TrainingAssignmentStatus } from "@prisma/client";

interface CompleteAssignmentProps {
  associationId: string;
  moduleId: string;
  userId: string;
  actorId: string;
  scorePercent?: number;
}

export async function completeAssignment({
  associationId,
  moduleId,
  userId,
  actorId,
  scorePercent,
}: CompleteAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.trainingAssignment.findUniqueOrThrow({
      where: { moduleId_userId: { moduleId, userId } },
      include: { module: true },
    });

    if (assignment.module.associationId !== associationId) {
      throw new Error("Module does not belong to this association");
    }

    const updatedAssignment = await tx.trainingAssignment.update({
      where: { moduleId_userId: { moduleId, userId } },
      data: {
        status: TrainingAssignmentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    const completion = await tx.trainingCompletion.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        scorePercent: scorePercent !== undefined ? scorePercent : null,
      },
      update: {
        scorePercent: scorePercent !== undefined ? scorePercent : undefined,
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
        newValues: {
          userId,
          moduleId,
          scorePercent,
          assignmentId: updatedAssignment.id,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      assignment: updatedAssignment,
      completion,
    };
  });
}

interface GetAssignedUsersProps {
  associationId: string;
  moduleId: string;
}

export async function getAssignedUsers({
  associationId,
  moduleId,
}: GetAssignedUsersProps) {
  const assignments = await prisma.trainingAssignment.findMany({
    where: {
      moduleId,
      module: { associationId },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const completions = await prisma.trainingCompletion.findMany({
    where: {
      moduleId,
      userId: { in: assignments.map((a) => a.userId) },
    },
  });

  const completionMap = new Map(
    completions.map((c) => [c.userId, c])
  );

  return assignments.map((assignment) => ({
    id: assignment.id,
    moduleId: assignment.moduleId,
    userId: assignment.userId,
    status: assignment.status,
    assignedAt: assignment.assignedAt.toISOString(),
    dueDate: assignment.dueDate?.toISOString() ?? null,
    startedAt: assignment.startedAt?.toISOString() ?? null,
    completedAt: assignment.completedAt?.toISOString() ?? null,
    notes: assignment.notes,
    user: assignment.user,
    completion: completionMap.has(assignment.userId)
      ? {
          id: completionMap.get(assignment.userId)!.id,
          scorePercent: completionMap.get(assignment.userId)!.scorePercent?.toNumber() ?? null,
          completedAt: completionMap.get(assignment.userId)!.completedAt.toISOString(),
        }
      : null,
  }));
}
