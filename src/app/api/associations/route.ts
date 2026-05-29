import { withValidation, withRole, withAssociation } from '@src/shared/api';
import { createAssociation } from '@src/features/associations/services/createAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { SuccessResponse } from '@src/shared/utils';
import { UserRole, type Association } from '@prisma/client';
import { ConflictError } from '@src/shared/errors';
import type { CreateAssociationInput } from '@validator/associations';
import { CreateAssociationSchema } from '@src/shared/validators';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info({ traceId }, 'GET /api/associations - Request started');
  const user = await withRole(req, UserRole.MEMBER);
  logger.info(
    { traceId, userId: user.id, roles: user.role },
    'GET /api/associations - User authorized',
  );

  logger.info({ traceId, associationId: association.id }, 'GET /api/associations - Success');

  return SuccessResponse({
    data: association,
  });
});

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, _ctx, { body, traceId }) => {
    logger.info({ traceId, name: body?.name }, 'POST /api/associations - Request started');
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations - User authorized',
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
        'POST /api/associations - Association Already Exists',
      );
      throw new ConflictError('Association Already Exists');
    }

    const association = await createAssociation({
      data: body as CreateAssociationInput,
    });

    logger.info({ traceId, associationId: association.id }, 'POST /api/associations - Success');

    return SuccessResponse<Association>(
      {
        data: association,
        message: 'Association created successfully',
      },
      201,
    );
  },
);
