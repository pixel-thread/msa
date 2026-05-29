import { UserRole } from '@prisma/client';
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { withAssociation, withRole } from '@src/shared/api';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const SuspenseUserRouteParams = z.object({
  memberId: z.uuid(),
});

export const POST = withAssociation(
  { params: SuspenseUserRouteParams },
  async (association, { params, traceId }, req) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/members/[memberId]/suspend - Request started',
    );

    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/members/[memberId]/suspend - User authorized',
    );

    const target = await findUniqueMember({ where: { id: params?.memberId } });

    if (!target) {
      throw new NotFoundError('Member not found');
    }

    if (target.associationId !== association.id) {
      throw new BadRequestError('Member does not belong to this association');
    }
    const updatedMember = await updateMember({
      where: { id: params?.memberId },
      data: { status: 'SUSPENDED' },
    });

    logger.info(
      {
        traceId,
        memberId: params?.memberId,
      },
      'POST /api/members/[memberId]/suspend - Success',
    );

    return SuccessResponse({
      data: updatedMember,
      message: 'Member suspended successfully',
    });
  },
);
