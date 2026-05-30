// ---- External libs ----
import { AuditAction, Prisma, TrainingAssignmentStatus } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

// ---- Interfaces ----

/** Parameters for completing a training assignment. */
interface CompleteAssignmentProps {
  associationId: string;
  moduleId: string;
  userId: string;
  actorId: string;
  scorePercent?: number;
  certificateOption?: 'none' | 'global' | 'custom';
  certificateUrl?: string;
  certificateFileId?: string;
  certificateNumber?: string;
}

/** Parameters for retrieving assigned users. */
interface GetAssignedUsersProps {
  associationId: string;
  moduleId: string;
  page?: number;
}

// ---- Services ----

/**
 * Mark a training assignment as complete, create completion record, and optionally issue a certificate.
 *
 * Business intent: When a secretary approves completion, the assignment status moves to COMPLETED,
 * a TrainingCompletion record is upserted, and if certificateOption is 'global' or 'custom',
 * a TrainingCertificate is issued. For 'global' certificates, the module's template URL is used.
 */
export async function completeAssignment({
  associationId,
  moduleId,
  userId,
  actorId,
  scorePercent,
  certificateOption = 'none',
  certificateUrl,
  certificateFileId,
  certificateNumber,
}: CompleteAssignmentProps) {
  return await prisma.$transaction(async (tx) => {
    // Fetch the assignment with module and certificate template info
    const assignment = await tx.trainingAssignment.findUniqueOrThrow({
      where: { moduleId_userId: { moduleId, userId } },
      include: {
        module: {
          select: {
            associationId: true,
            certificateTemplateId: true,
            certificateTemplate: {
              select: {
                certificateUrl: true,
                fileId: true,
              },
            },
          },
        },
      },
    });

    // Cross-tenant safety check: verify the module belongs to this association
    if (assignment.module.associationId !== associationId) {
      throw new Error('Module does not belong to this association');
    }

    // Update assignment status to COMPLETED
    const updatedAssignment = await tx.trainingAssignment.update({
      where: { moduleId_userId: { moduleId, userId } },
      data: {
        status: TrainingAssignmentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Upsert completion record
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

    // Handle certificate creation
    let certUrl = certificateUrl;
    let certFileId = certificateFileId;

    // For 'global' certificates, use the module's template URL
    if (certificateOption === 'global' && assignment.module.certificateTemplate?.certificateUrl) {
      certUrl = assignment.module.certificateTemplate.certificateUrl;
      certFileId = assignment.module.certificateTemplate.fileId || undefined;
    }

    // Issue or update certificate if applicable
    if (certificateOption !== 'none' && certUrl) {
      await tx.trainingCertificate.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        create: {
          userId,
          moduleId,
          certificateUrl: certUrl,
          ...(certFileId && { fileId: certFileId }),
          ...(certificateNumber && { certificateNumber }),
        },
        update: {
          certificateUrl: certUrl,
          ...(certFileId && { fileId: certFileId }),
          ...(certificateNumber && { certificateNumber }),
        },
      });
    }

    // Audit the completion action
    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.TRAINING_COMPLETE,
        resourceType: 'TrainingCompletion',
        resourceId: completion.id,
        newValues: {
          userId,
          moduleId,
          scorePercent,
          certificateOption,
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

/**
 * Retrieve paginated list of users assigned to a module with their completion status.
 *
 * Business intent: Secretaries view the assignment roster alongside each user's
 * completion data to track training progress.
 */
export async function getAssignedUsers({
  associationId,
  moduleId,
  page = 1,
}: GetAssignedUsersProps) {
  const skip = (page - 1) * PAGE_SIZE;

  const [assignments, total] = await Promise.all([
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

  // Batch-fetch completions for all assigned users
  const completions = await prisma.trainingCompletion.findMany({
    where: {
      moduleId,
      userId: { in: assignments.map((a) => a.userId) },
    },
  });

  const completionMap = new Map(completions.map((c) => [c.userId, c]));

  return {
    data: assignments.map((assignment) => ({
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
    })),
    total,
  };
}
