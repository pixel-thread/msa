// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { ConflictError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------

import { UpdateMemberTypeInput } from '../validators';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** Parameters for updating a member type. */
interface UpdateMemberTypeProps {
  associationId: string;
  actorId: string;
  memberTypeId: string;
  data: UpdateMemberTypeInput;
}

// ---------------------------------------------------------------------------
// Update member type
//
// If level is being changed, rejects the operation when another member type
// in the same association already occupies that level. Writes audit log
// inside the same transaction.
// ---------------------------------------------------------------------------

/**
 * Update a member type with duplicate-level checking and audit logging.
 *
 * WHY: Levels must remain unique per association to preserve ordering;
 * allowing a collision would make the level sort ambiguous.
 */
export async function updateMemberType({
  associationId,
  actorId,
  memberTypeId,
  data,
}: UpdateMemberTypeProps) {
  // ---- Guard: check for level collision (exclude self) ---------------------

  if (data.level) {
    const existing = await prisma.memberType.findFirst({
      where: { associationId, level: data.level, NOT: { id: memberTypeId } },
    });

    if (existing) {
      throw new ConflictError(`Member type with level ${data.level} already exists`);
    }
  }

  // ---- Transaction: update member type + write audit log -------------------

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
