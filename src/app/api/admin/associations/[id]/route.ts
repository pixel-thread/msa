import { withValidation, withRole } from '@src/shared/api';
import { CreateAssociationInput, CreateAssociationSchema } from '@validator/associations';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { deleteAssociation } from '@src/features/associations/services/deleteAssociation';
import { SuccessResponse } from '@src/shared/utils';
import type { Association } from '@prisma/client';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import z from 'zod';
import { logger } from '@src/shared/logger/server';
import { UserRole } from '@prisma/client';

const ParamsSchema = z.object({
  id: z.uuid(),
});

export const GET = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info({ traceId, id: params?.id }, 'GET /api/admin/associations/[id] - Request started');
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/associations/[id] - User authorized',
    );

    const association = await findUniqueAssociation({
      where: { id: params?.id },
    });

    if (!association) {
      logger.error(
        { traceId, id: params?.id },
        'GET /api/admin/associations/[id] - Association not found',
      );
      throw new NotFoundError('Association not found');
    }

    logger.info({ traceId, id: params?.id }, 'GET /api/admin/associations/[id] - Success');

    return SuccessResponse<Association>({
      data: association,
      message: 'Association found successfully',
    });
  },
);

export const PUT = withValidation(
  { body: CreateAssociationSchema, params: ParamsSchema },
  async (req, _ctx, { body, params, traceId }) => {
    logger.info(
      { traceId, id: params?.id, name: body?.name },
      'PUT /api/admin/associations/[id] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PUT /api/admin/associations/[id] - User authorized',
    );

    const existing = await findUniqueAssociation({
      where: { id: params?.id },
    });

    if (!existing) {
      logger.error(
        { traceId, id: params?.id },
        'PUT /api/admin/associations/[id] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }

    if (body?.slug !== existing.slug || body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: params?.id },
          OR: [{ slug: body?.slug }, { name: body?.name }],
        },
        take: 1,
      });

      if (conflict) {
        logger.error(
          { traceId, slug: body?.slug, name: body?.name },
          'PUT /api/admin/associations/[id] - Association conflict',
        );
        throw new ConflictError('Association with this slug or name already exists');
      }
    }

    const updated = await updateAssociation({
      where: { id: params?.id as string },
      data: body as CreateAssociationInput,
    });

    logger.info({ traceId, id: params?.id }, 'PUT /api/admin/associations/[id] - Success');

    return SuccessResponse<Association>(
      { data: updated, message: 'Association updated successfully' },
      200,
    );
  },
);

export const DELETE = withValidation(
  { params: ParamsSchema },
  async (req, _ctx, { params, traceId }) => {
    logger.info(
      { traceId, id: params?.id },
      'DELETE /api/admin/associations/[id] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'DELETE /api/admin/associations/[id] - User authorized',
    );

    const existing = await findUniqueAssociation({
      where: { id: params?.id },
    });

    if (!existing) {
      logger.error(
        { traceId, id: params?.id },
        'DELETE /api/admin/associations/[id] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }

    const deleted = await deleteAssociation({
      id: params?.id as string,
    });

    logger.info({ traceId, id: params?.id }, 'DELETE /api/admin/associations/[id] - Success');

    return SuccessResponse<Association>(
      { data: deleted, message: 'Association deleted successfully' },
      200,
    );
  },
);
