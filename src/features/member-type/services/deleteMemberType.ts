import 'server-only';
import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';
import { BadRequestError } from '@src/shared/errors';

interface DeleteMemberTypeProps {
  associationId: string;
  actorId: string;
  memberTypeId: string;
}

export async function deleteMemberType({
  associationId,
  actorId,
  memberTypeId,
}: DeleteMemberTypeProps) {
  const usersCount = await prisma.user.count({
    where: { memberTypeId },
  });

  if (usersCount > 0) {
    throw new BadRequestError(
      'Cannot delete member type that has users assigned. Please reassign users first.',
    );
  }

  const plansCount = await prisma.subscriptionPlan.count({
    where: { memberTypeId },
  });

  if (plansCount > 0) {
    throw new BadRequestError(
      'Cannot delete member type that has subscription plans linked. Please update plans first.',
    );
  }

  return await prisma.$transaction(async (tx) => {
    const memberType = await tx.memberType.delete({
      where: { id: memberTypeId },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.DELETE,
        resourceType: 'MemberType',
        resourceId: memberTypeId,
        oldValues: {
          description: memberType.description,
          level: memberType.level,
        } as Prisma.InputJsonValue,
      },
    });

    return memberType;
  });
}
