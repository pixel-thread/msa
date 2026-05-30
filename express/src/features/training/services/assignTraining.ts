// ---- External libs ----
import { AuditAction, Prisma } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

// ---- Interfaces ----

/** Parameters for retrieving training assignments. */
interface GetTrainingAssignmentsProps {
  associationId: string;
  moduleId: string;
  page?: number;
}

/** Parameters for assigning training to a user. */
interface AssignTrainingProps {
  associationId: string;
  moduleId: string;
  userId: string;
  assignedById: string;
}

/** Parameters for bulk assigning training. */
interface BulkAssignTrainingProps {
  associationId: string;
  moduleId: string;
  userIds: string[];
  assignedById: string;
}

/** Parameters for removing a training assignment. */
interface RemoveTrainingAssignmentProps {
  associationId: string;
  moduleId: string;
  userId: string;
  removedById: string;
}

/** Parameters for bulk removing training assignments. */
interface BulkRemoveTrainingAssignmentProps {
  associationId: string;
  moduleId: string;
  userIds: string[];
  removedById: string;
}

// ---- Services ----

/**
 * Retrieve paginated training assignments for a module.
 *
 * Business intent: Used by secretaries to see who is assigned to a module.
 */
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

/**
 * Assign a user to a training module with role validation and audit logging.
 *
 * Business intent: DPOs manually assign specific users who need this training.
 * Validates that the user's role matches the module's required roles.
 * Returns existing assignment if already assigned (idempotent).
 */
export async function assignTraining({
  associationId,
  moduleId,
  userId,
  assignedById,
}: AssignTrainingProps) {
  return await prisma.$transaction(async (tx) => {
    // Validate module exists in association
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    // Validate user exists in association
    const user = await tx.user.findFirst({
      where: { id: userId, associationId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify user's role is compatible with module requirements
    const hasMatchingRole = trainingModule.requiredForRoles.some((role) =>
      user.role.includes(role),
    );

    if (!hasMatchingRole) {
      throw new Error("User's role does not match the required roles for this training module");
    }

    // Idempotent: return existing assignment if present
    const existingAssignment = await tx.trainingAssignment.findUnique({
      where: { moduleId_userId: { moduleId, userId } },
    });

    if (existingAssignment) {
      return existingAssignment;
    }

    // Create the assignment
    const assignment = await tx.trainingAssignment.create({
      data: {
        moduleId,
        userId,
        assignedById,
        status: 'ASSIGNED',
      },
    });

    // Audit the assignment
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

/**
 * Bulk assign multiple users to a training module, skipping those without matching roles.
 *
 * Business intent: DPOs can assign multiple users at once. Users whose roles don't match
 * the module requirements are reported as skipped rather than failing the entire operation.
 */
export async function bulkAssignTraining({
  associationId,
  moduleId,
  userIds,
  assignedById,
}: BulkAssignTrainingProps) {
  return await prisma.$transaction(async (tx) => {
    // Validate module exists
    const trainingModule = await tx.trainingModule.findFirst({
      where: { id: moduleId, associationId },
    });

    if (!trainingModule) {
      throw new Error('Training module not found');
    }

    // Fetch all target users in one query
    const users = await tx.user.findMany({
      where: {
        id: { in: userIds },
        associationId,
      },
    });

    if (users.length === 0) {
      throw new Error('No valid users found');
    }

    // Filter by role compatibility
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

    // Create only new (non-duplicate) assignments
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

        // Audit the bulk operation
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

/**
 * Remove a single training assignment with audit logging.
 *
 * Business intent: DPOs can unassign a user from a module if the assignment was made in error.
 */
export async function removeTrainingAssignment({
  associationId,
  moduleId,
  userId,
  removedById,
}: RemoveTrainingAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    // Find the assignment within the association scope
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

    // Delete the assignment
    await tx.trainingAssignment.delete({
      where: { id: assignment.id },
    });

    // Audit the removal
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

/**
 * Bulk remove training assignments for specified users with audit logging.
 *
 * Business intent: DPOs can mass-unassign users from a module.
 * Missing assignments are reported as notFound rather than failing entirely.
 */
export async function bulkRemoveTrainingAssignment({
  associationId,
  moduleId,
  userIds,
  removedById,
}: BulkRemoveTrainingAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    // Find all assignments that exist for the given users
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

    // Delete all at once
    await tx.trainingAssignment.deleteMany({
      where: { id: { in: deletedIds } },
    });

    // Audit the bulk removal
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
