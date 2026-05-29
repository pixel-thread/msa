import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { BadRequestError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import {
  findUniqueMemberType,
  updateMemberType,
  deleteMemberType,
} from '@feature/member-type/services';
import { UpdateMemberTypeSchema, MemberTypeParamsSchema } from '@feature/member-type/validators';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { params: MemberTypeParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/member-types/[memberTypeId] - Request started',
    );

    if (!params) {
      throw new BadRequestError('Invalid member type ID');
    }

    const user = await withRole(request, UserRole.MEMBER);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/member-types/[memberTypeId] - User authorized',
    );

    const { memberTypeId } = params;

    const memberType = await findUniqueMemberType({
      associationId: association.id,
      memberTypeId,
    });

    if (!memberType) {
      throw new NotFoundError('Member type not found');
    }

    logger.info(
      {
        traceId,
        memberTypeId,
      },
      'GET /api/member-types/[memberTypeId] - Success',
    );

    return SuccessResponse({ data: memberType, message: 'Member type found' });
  },
);

export const PATCH = withAssociation(
  { params: MemberTypeParamsSchema, body: UpdateMemberTypeSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'PATCH /api/member-types/[memberTypeId] - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid member type ID');
    }

    if (!body) {
      throw new ForbiddenError('Invalid request body');
    }

    const user = await withRole(request, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'PATCH /api/member-types/[memberTypeId] - User authorized',
    );

    const { memberTypeId } = params;

    const memberType = await updateMemberType({
      associationId: association.id,
      actorId: user.id,
      memberTypeId,
      data: body,
    });

    logger.info(
      {
        traceId,
        memberTypeId,
      },
      'PATCH /api/member-types/[memberTypeId] - Success',
    );

    return SuccessResponse({
      data: memberType,
      message: 'Member type updated successfully',
    });
  },
);

export const DELETE = withAssociation(
  { params: MemberTypeParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'DELETE /api/member-types/[memberTypeId] - Request started',
    );

    if (!params) {
      throw new ForbiddenError('Invalid member type ID');
    }

    const user = await withRole(request, UserRole.PRESIDENT);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'DELETE /api/member-types/[memberTypeId] - User authorized',
    );

    const { memberTypeId } = params;

    await deleteMemberType({
      associationId: association.id,
      actorId: user.id,
      memberTypeId,
    });

    logger.info(
      {
        traceId,
        memberTypeId,
      },
      'DELETE /api/member-types/[memberTypeId] - Success',
    );

    return SuccessResponse({
      data: null,
      message: 'Member type deleted successfully',
    });
  },
);
