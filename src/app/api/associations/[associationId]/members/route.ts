import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { ConflictError, NotFoundError, ValidationError } from '@src/shared/errors';
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const BodySchema = z.object({
  memberId: z.string(),
});
const ParamsSchema = z.object({
  associationId: z.uuid(),
});

export const POST = withAssociation(
  { body: BodySchema, params: ParamsSchema },
  async (association, { body, params, traceId }, request) => {
    logger.info(
      {
        traceId,
        targetMemberId: body?.memberId,
        associationId: params?.associationId,
      },
      'POST /api/associations/[associationId]/members - Request started',
    );
    const user = await withRole(request as NextRequest, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/members - User authorized',
    );

    if (!body?.memberId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/members - memberId is required',
      );
      throw new ValidationError('memberId is required');
    }

    const existingMember = await findUniqueMember({
      where: { id: body.memberId },
    });

    if (!existingMember) {
      logger.error(
        { traceId, targetMemberId: body.memberId },
        'POST /api/associations/[associationId]/members - Member not found',
      );
      throw new NotFoundError('Member not found');
    }

    if (existingMember.associationId === params?.associationId) {
      logger.error(
        {
          traceId,
          targetMemberId: body.memberId,
          associationId: params?.associationId,
        },
        'POST /api/associations/[associationId]/members - Member already in this association',
      );
      throw new ConflictError('Member already in this association');
    }

    const updatedMember = await updateMember({
      where: { id: body.memberId },
      data: { association: { connect: { id: association.id } } },
    });

    logger.info(
      { traceId, targetMemberId: body.memberId, associationId: association.id },
      'POST /api/associations/[associationId]/members - Success',
    );

    return SuccessResponse({ data: updatedMember }, 201);
  },
);
