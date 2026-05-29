import { UserRole } from '@prisma/client';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { withValidation, withRole } from '@src/shared/api';
import { UnauthorizedError } from '@src/shared/errors';
import { SuccessResponse } from '@src/shared/utils';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  associationId: z.string().uuid(),
});

export const POST = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info(
      { traceId, associationId: params?.associationId },
      'POST /api/associations/[associationId]/deactivate - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/deactivate - User authorized',
    );

    const userId = req.headers.get('x-user-id');

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Unauthorized (missing x-user-id header)',
      );
      throw new UnauthorizedError('Unauthorized');
    }

    const associationId = params?.associationId;
    if (!associationId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Association ID is required',
      );
      throw new UnauthorizedError('Association ID is required');
    }

    const isAssociationExist = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!isAssociationExist) {
      logger.error(
        { traceId, associationId },
        'POST /api/associations/[associationId]/deactivate - Association not found',
      );
      throw new Error('Association not found');
    }

    const updatedAssociation = await updateAssociation({
      where: { id: associationId },
      data: { isActive: false },
    });

    logger.info(
      { traceId, associationId },
      'POST /api/associations/[associationId]/deactivate - Success',
    );

    return SuccessResponse({
      data: updatedAssociation,
      message: 'Association deactivated successfully',
    });
  },
);
