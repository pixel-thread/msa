import 'server-only';
import { prisma } from '@lib/prisma';
import { UpdateMemberTypeInput } from '../validators';
import { AuditAction, Prisma } from '@prisma/client';
import { ConflictError } from '@src/shared/errors';

interface UpdateMemberTypeProps {
  associationId: string;
  actorId: string;
  memberTypeId: string;
  data: UpdateMemberTypeInput;
}

export async function updateMemberType({
  associationId,
  actorId,
  memberTypeId,
  data,
}: UpdateMemberTypeProps) {
  if (data.level) {
    const existing = await prisma.memberType.findFirst({
      where: { associationId, level: data.level, NOT: { id: memberTypeId } },
    });

    if (existing) {
      throw new ConflictError(`Member type with level ${data.level} already exists`);
    }
  }

  return await prisma.$transaction(async (tx) => {
    const memberType = await tx.memberType.update({
      where: { id: memberTypeId },
      data,
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId,
        action: AuditAction.UPDATE,
        resourceType: 'MemberType',
        resourceId: memberTypeId,
        newValues: data as Prisma.InputJsonValue,
      },
    });

    return memberType;
  });
}
