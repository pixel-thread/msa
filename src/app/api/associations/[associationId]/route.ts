import { withValidation, withRole } from '@src/shared/api';
import { CreateAssociationInput } from '@validator/associations';
import { UpdateAssociationSchema } from '@src/features/associations/validators';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { SuccessResponse } from '@src/shared/utils';
import type { Association } from '@prisma/client';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import z from 'zod';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';

const ParamsSchema = z.object({
  associationId: z.uuid(),
});

export const GET = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info(
      { traceId, associationId: params?.associationId },
      'GET /api/associations/[associationId] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations/[associationId] - User authorized',
    );

    const association = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!association) {
      logger.error(
        { traceId, associationId: params?.associationId },
        'GET /api/associations/[associationId] - Association not found',
      );
      throw new NotFoundError('Association not found');
    }

    logger.info(
      { traceId, associationId: params?.associationId },
      'GET /api/associations/[associationId] - Success',
    );

    return SuccessResponse<Association>({
      data: association,
      message: 'Association found successfully',
    });
  },
);

export const PATCH = withValidation(
  { body: UpdateAssociationSchema, params: ParamsSchema },
  async (req, _ctx, { body, params, traceId }) => {
    logger.info(
      { traceId, associationId: params?.associationId },
      'PATCH /api/associations/[associationId] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PATCH /api/associations/[associationId] - User authorized',
    );

    const existing = await findUniqueAssociation({
      where: { id: params?.associationId },
    });

    if (!existing) {
      logger.error(
        { traceId, associationId: params?.associationId },
        'PATCH /api/associations/[associationId] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }

    if (body?.slug !== existing.slug || body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: params?.associationId },
          OR: [{ slug: body?.slug }, { name: body?.name }],
        },
        take: 1,
      });

      if (conflict) {
        logger.error(
          { traceId, slug: body?.slug, name: body?.name },
          'PATCH /api/associations/[associationId] - Association conflict',
        );
        throw new ConflictError('Association with this slug or name already exists');
      }
    }

    const updated = await updateAssociation({
      where: { id: params?.associationId as string },
      data: body as CreateAssociationInput,
    });

    logger.info(
      { traceId, associationId: params?.associationId },
      'PATCH /api/associations/[associationId] - Success',
    );

    return SuccessResponse<Association>(
      { data: updated, message: 'Association updated successfully' },
      200,
    );
  },
);
