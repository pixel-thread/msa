import 'server-only';
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { AuditAction, Prisma } from '@prisma/client';

interface GetTrainingAssignmentsProps {
  associationId: string;
  moduleId: string;
  page?: number;
}

export async function getTrainingAssignments({
  associationId,
  moduleId,
  page = 1,
}: GetTrainingAssignmentsProps) {
  const skip = (page - 1) * PAGE_SIZE;

  const [data, total] = await Promise.all([
    prisma.trainingAssignment.findMany({
      where: {
        moduleId,
        module: { associationId },
      },
      skip,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.trainingAssignment.count({
      where: {
        moduleId,
        module: { associationId },
      },
    }),
  ]);

  return { data, total };
}

interface AssignTrainingProps {
  associationId: string;
  moduleId: string;
  userId: string;
  assignedById: string;
}

export async function assignTraining({
  associationId,
  moduleId,
  userId,
  assignedById,
}: AssignTrainingProps) {
  return await prisma.$transaction(async (tx) => {
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    const user = await tx.user.findFirst({
      where: { id: userId, associationId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasMatchingRole = trainingModule.requiredForRoles.some((role) =>
      user.role.includes(role),
    );

    if (!hasMatchingRole) {
      throw new Error("User's role does not match the required roles for this training module");
    }

    const existingAssignment = await tx.trainingAssignment.findUnique({
      where: { moduleId_userId: { moduleId, userId } },
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    const assignment = await tx.trainingAssignment.create({
      data: {
        moduleId,
        userId,
        assignedById,
        status: 'ASSIGNED',
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: assignedById,
        action: AuditAction.TRAINING_ASSIGN,
        resourceType: 'TrainingAssignment',
        resourceId: assignment.id,
        newValues: { moduleId, userId } as Prisma.InputJsonValue,
      },
    });

    return assignment;
  });
}

interface BulkAssignTrainingProps {
  associationId: string;
  moduleId: string;
  userIds: string[];
  assignedById: string;
}

export async function bulkAssignTraining({
  associationId,
  moduleId,
  userIds,
  assignedById,
}: BulkAssignTrainingProps) {
  return await prisma.$transaction(async (tx) => {
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    const users = await tx.user.findMany({
      where: {
        id: { in: userIds },
        associationId,
      },
    });

    if (users.length === 0) {
      throw new Error('No valid users found');
    }

    const validAssignments: {
      moduleId: string;
      userId: string;
      assignedById: string;
      status: 'ASSIGNED';
    }[] = [];
    const skippedUsers: string[] = [];

    for (const user of users) {
      const hasMatchingRole = trainingModule.requiredForRoles.some((role) =>
        user.role.includes(role),
      );

      if (hasMatchingRole) {
        validAssignments.push({
          moduleId,
          userId: user.id,
          assignedById,
          status: 'ASSIGNED',
        });
      } else {
        skippedUsers.push(user.id);
      }
    }

    let createdAssignments: { moduleId: string; userId: string }[] = [];

    if (validAssignments.length > 0) {
      const existingAssignments = await tx.trainingAssignment.findMany({
        where: {
          moduleId,
          userId: { in: validAssignments.map((a) => a.userId) },
        },
        select: { userId: true },
      });

      const existingUserIds = new Set(existingAssignments.map((a) => a.userId));
      const newAssignments = validAssignments.filter((a) => !existingUserIds.has(a.userId));

      if (newAssignments.length > 0) {
        createdAssignments = await tx.trainingAssignment.createManyAndReturn({
          data: newAssignments,
        });

        await tx.auditLog.create({
          data: {
            associationId,
            actorId: assignedById,
            action: AuditAction.TRAINING_ASSIGN,
            resourceType: 'TrainingAssignment',
            resourceId: moduleId,
            newValues: {
              assignedUserIds: validAssignments.map((a) => a.userId),
              skippedUserIds: skippedUsers,
            } as Prisma.InputJsonValue,
          },
        });
      }
    }

    return {
      created: createdAssignments,
      skipped: skippedUsers,
    };
  });
}

interface RemoveTrainingAssignmentProps {
  associationId: string;
  moduleId: string;
  userId: string;
  removedById: string;
}

export async function removeTrainingAssignment({
  associationId,
  moduleId,
  userId,
  removedById,
}: RemoveTrainingAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.trainingAssignment.findFirst({
      where: {
        moduleId,
        userId,
        module: { associationId },
      },
    });

    if (!assignment) {
      throw new Error('Training assignment not found');
    }

    await tx.trainingAssignment.delete({
      where: { id: assignment.id },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: removedById,
        action: AuditAction.TRAINING_UNASSIGN,
        resourceType: 'TrainingAssignment',
        resourceId: assignment.id,
        newValues: { moduleId, userId } as Prisma.InputJsonValue,
      },
    });

    return { success: true, message: 'Training assignment removed' };
  });
}

interface BulkRemoveTrainingAssignmentProps {
  associationId: string;
  moduleId: string;
  userIds: string[];
  removedById: string;
}

export async function bulkRemoveTrainingAssignment({
  associationId,
  moduleId,
  userIds,
  removedById,
}: BulkRemoveTrainingAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    const existingAssignments = await tx.trainingAssignment.findMany({
      where: {
        moduleId,
        userId: { in: userIds },
        module: { associationId },
      },
      select: { id: true, userId: true },
    });

    if (existingAssignments.length === 0) {
      return { deleted: [], notFound: userIds };
    }

    const deletedIds = existingAssignments.map((a) => a.id);
    const deletedUserIds = existingAssignments.map((a) => a.userId);
    const notFoundUserIds = userIds.filter((id) => !deletedUserIds.includes(id));

    await tx.trainingAssignment.deleteMany({
      where: { id: { in: deletedIds } },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: removedById,
        action: AuditAction.TRAINING_UNASSIGN,
        resourceType: 'TrainingAssignment',
        resourceId: moduleId,
        newValues: {
          removedUserIds: deletedUserIds,
          notFoundUserIds,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      deleted: deletedUserIds,
      notFound: notFoundUserIds,
    };
  });
}
