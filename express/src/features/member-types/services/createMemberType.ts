import 'server-only';
import { prisma } from '@lib/prisma';
import { CreateMemberTypeInput } from '../validators';
import { AuditAction, Prisma } from '@prisma/client';
import { ConflictError } from '@src/shared/errors';

interface CreateMemberTypeProps {
  associationId: string;
  actorId: string;
  data: CreateMemberTypeInput;
}

export async function createMemberType({ associationId, actorId, data }: CreateMemberTypeProps) {
  const existing = await prisma.memberType.findFirst({
    where: { associationId, level: data.level },
  });

  if (existing) {
    throw new ConflictError(
      `Member type with level ${data.level} already exists for this association`,
    );
  }

  return await prisma.$transaction(async (tx) => {
    const memberType = await tx.memberType.create({
      data: {
        associationId,
        description: data.description,
        level: data.level,
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.CREATE,
        resourceType: 'MemberType',
        resourceId: memberType.id,
        newValues: data as Prisma.InputJsonValue,
      },
    });

    return memberType;
  });
}
