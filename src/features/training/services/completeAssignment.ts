import 'server-only';
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { AuditAction, Prisma, TrainingAssignmentStatus } from '@prisma/client';

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

    if (assignment.module.associationId !== associationId) {
      throw new Error('Module does not belong to this association');
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

    // Handle certificate creation
    let certUrl = certificateUrl;
    let certFileId = certificateFileId;

    if (certificateOption === 'global' && assignment.module.certificateTemplate?.certificateUrl) {
      certUrl = assignment.module.certificateTemplate.certificateUrl;
      certFileId = assignment.module.certificateTemplate.fileId || undefined;
    }

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

interface GetAssignedUsersProps {
  associationId: string;
  moduleId: string;
  page?: number;
}

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
