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

import { CreateMemberTypeInput } from '../validators';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** Parameters for creating a member type. */
interface CreateMemberTypeProps {
  associationId: string;
  actorId: string;
  data: CreateMemberTypeInput;
}

// ---------------------------------------------------------------------------
// Create member type
//
// Ensures no duplicate level within the same association before persisting.
// Writes an audit log entry within the same transaction.
// ---------------------------------------------------------------------------

/**
 * Create a member type with duplicate-level checking and audit logging.
 *
 * WHY: Members are organised by type with unique level ordering; allowing
 * duplicate levels would break the sorting guarantee.
 */
export async function createMemberType({ associationId, actorId, data }: CreateMemberTypeProps) {
  // ---- Guard: check for duplicate level within association -----------------

  const existing = await prisma.memberType.findFirst({
    where: { associationId, level: data.level },
  });

  if (existing) {
    throw new ConflictError(
      `Member type with level ${data.level} already exists for this association`,
    );
  }

  // ---- Transaction: create member type + write audit log -------------------

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
