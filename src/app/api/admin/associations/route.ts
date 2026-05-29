import { withValidation, withRole } from '@src/shared/api';
import { createAssociation } from '@src/features/associations/services/createAssociation';
import { findManyAssociation } from '@src/features/associations/services/findManyAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole } from '@prisma/client';
import type { Association } from '@prisma/client';
import { ConflictError } from '@src/shared/errors';
import type { CreateAssociationInput } from '@validator/associations';
import { CreateAssociationSchema } from '@src/shared/validators';
import { logger } from '@src/shared/logger/server';

export const GET = withValidation({}, async (req, _ctx, { traceId }) => {
  logger.info({ traceId }, 'GET /api/admin/associations - Request started');
  const user = await withRole(req, UserRole.SUPER_ADMIN);
  logger.info(
    { traceId, userId: user.id, roles: user.role },
    'GET /api/admin/associations - User authorized',
  );

  const data = await findManyAssociation({
    orderBy: { createdAt: 'desc' },
    where: { status: 'ACTIVE' },
  });

  logger.info(
    { traceId, count: data.associations.length },
    'GET /api/admin/associations - Success',
  );

  return SuccessResponse<Association[]>({
    data: data.associations,
    meta: data.pagination,
  });
});

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info({ traceId, name: body?.name }, 'POST /api/admin/associations - Request started');
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations - User authorized',
    );

    const existing = await findFirstAssociation({
      where: {
        OR: [
          { slug: body?.slug, status: 'ACTIVE' },
          { name: body?.name, status: 'ACTIVE' },
        ],
      },
      take: 1,
    });

    if (existing) {
      logger.error(
        { traceId, slug: body?.slug, name: body?.name },
        'POST /api/admin/associations - Association Already Exists',
      );
      throw new ConflictError('Association Already Exists');
    }

    const association = await createAssociation({
      data: body as CreateAssociationInput,
    });

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/admin/associations - Success',
    );

    return SuccessResponse<Association>(
      {
        data: association,
        message: 'Association created successfully',
      },
      201,
    );
  },
);
