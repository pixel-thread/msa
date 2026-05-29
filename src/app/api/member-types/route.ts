import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { BadRequestError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { createMemberType, findManyMemberTypes } from '@feature/member-type/services';
import { CreateMemberTypeSchema } from '@feature/member-type/validators';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info(
    {
      traceId,
      associationId: association.id,
    },
    'GET /api/member-types - Request started',
  );

  const user = await withRole(request, UserRole.MEMBER);

  logger.info(
    {
      traceId,
      userId: user.id,
    },
    'GET /api/member-types - User authorized',
  );

  const memberTypes = await findManyMemberTypes({
    associationId: association.id,
  });

  logger.info(
    {
      traceId,
      count: memberTypes.length,
    },
    'GET /api/member-types - Success',
  );

  return SuccessResponse({ data: memberTypes });
});

export const POST = withAssociation(
  { body: CreateMemberTypeSchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'POST /api/member-types - Request started',
    );

    if (!body) {
      throw new BadRequestError('Invalid request body');
    }

    const user = await withRole(request, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'POST /api/member-types - User authorized',
    );

    const memberType = await createMemberType({
      associationId: association.id,
      actorId: user.id,
      data: body,
    });

    logger.info(
      {
        traceId,
        memberTypeId: memberType.id,
      },
      'POST /api/member-types - Success',
    );

    return SuccessResponse({ data: memberType }, 201);
  },
);
