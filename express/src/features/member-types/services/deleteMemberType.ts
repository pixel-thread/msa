// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------

import { prisma } from '@lib/prisma';
import { AuditAction, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { BadRequestError } from '@src/shared/errors';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** Parameters for deleting a member type. */
interface DeleteMemberTypeProps {
  associationId: string;
  actorId: string;
  memberTypeId: string;
}

// ---------------------------------------------------------------------------
// Delete member type
//
// Soft-prevention: refuses deletion if any user or subscription plan still
// references the member type. Writes audit log with old values inside a
// transaction.
// ---------------------------------------------------------------------------

/**
 * Delete a member type if it has no assigned users or linked subscription plans.
 *
 * WHY: Orphaned users or subscription plans would cause data integrity
 * issues; callers must reassign or clean up references first.
 */
export async function deleteMemberType({
  associationId,
  actorId,
  memberTypeId,
}: DeleteMemberTypeProps) {
  // ---- Guard: check for assigned users ------------------------------------

  const usersCount = await prisma.user.count({
    where: { memberTypeId },
  });

  if (usersCount > 0) {
    throw new BadRequestError(
      'Cannot delete member type that has users assigned. Please reassign users first.',
    );
  }

  // ---- Guard: check for linked subscription plans --------------------------

  const plansCount = await prisma.subscriptionPlan.count({
    where: { memberTypeId },
  });

  if (plansCount > 0) {
    throw new BadRequestError(
      'Cannot delete member type that has subscription plans linked. Please update plans first.',
    );
  }

  // ---- Transaction: delete member type + write audit log -------------------

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
