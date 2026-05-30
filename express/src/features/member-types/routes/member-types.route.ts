import { Request, NextFunction, Response, type RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { BadRequestError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import {
  findManyMemberTypes,
  findUniqueMemberType,
  createMemberType,
  updateMemberType,
  deleteMemberType as _deleteMemberType,
} from '@feature/member-types/services';
import {
  CreateMemberTypeSchema,
  UpdateMemberTypeSchema,
  MemberTypeParamsSchema,
} from '@feature/member-types/validators';

export const getMemberTypes: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/member-types - Request started',
    );
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id }, 'GET /api/member-types - User authorized');
    const memberTypes = findManyMemberTypes
      ? await findManyMemberTypes({ associationId: association.id })
      : [];
    logger.info({ traceId, count: memberTypes.length }, 'GET /api/member-types - Success');
    return success(res, { data: memberTypes });
  },
];

export const postMemberType: RequestHandler[] = [
  ...(CreateMemberTypeSchema ? [validate({ body: CreateMemberTypeSchema })] : []),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/member-types - Request started',
    );
    if (!req.body) throw new BadRequestError('Invalid request body');
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info({ traceId, userId: user.id }, 'POST /api/member-types - User authorized');
    const memberType = await createMemberType({
      associationId: association.id,
      actorId: user.id,
      data: req.body,
    });
    logger.info({ traceId, memberTypeId: memberType?.id }, 'POST /api/member-types - Success');
    return success(res, { data: memberType }, 201);
  },
];

export const getMemberTypeById: RequestHandler[] = [
  validate({ params: MemberTypeParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/member-types/[memberTypeId] - Request started',
    );
    if (!req.params.memberTypeId) throw new BadRequestError('Invalid member type ID');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id },
      'GET /api/member-types/[memberTypeId] - User authorized',
    );
    const memberTypeId = req.params.memberTypeId as string;

    const memberType = await findUniqueMemberType({ associationId: association.id, memberTypeId });
    if (!memberType) throw new NotFoundError('Member type not found');
    logger.info({ traceId, memberTypeId }, 'GET /api/member-types/[memberTypeId] - Success');
    return success(res, { data: memberType, message: 'Member type found' });
  },
];

export const patchMemberType: RequestHandler[] = [
  ...(UpdateMemberTypeSchema ? [validate({ body: UpdateMemberTypeSchema })] : []),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'PATCH /api/member-types/[memberTypeId] - Request started',
    );
    if (!req.params.memberTypeId) throw new ForbiddenError('Invalid member type ID');
    if (!req.body) throw new ForbiddenError('Invalid request body');
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id },
      'PATCH /api/member-types/[memberTypeId] - User authorized',
    );
    const memberTypeId = req.params.memberTypeId as string;
    const memberType = await updateMemberType({
      associationId: association.id,
      actorId: user.id,
      memberTypeId,
      data: req.body,
    });
    logger.info({ traceId, memberTypeId }, 'PATCH /api/member-types/[memberTypeId] - Success');
    return success(res, { data: memberType, message: 'Member type updated successfully' });
  },
];

export const deleteMemberType: RequestHandler[] = [
  validate({ params: MemberTypeParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'DELETE /api/member-types/[memberTypeId] - Request started',
    );
    if (!req.params.memberTypeId) throw new ForbiddenError('Invalid member type ID');
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id },
      'DELETE /api/member-types/[memberTypeId] - User authorized',
    );
    const memberTypeId = req.params.memberTypeId as string;
    if (_deleteMemberType) {
      await _deleteMemberType({ associationId: association.id, actorId: user.id, memberTypeId });
    }

    logger.info({ traceId, memberTypeId }, 'DELETE /api/member-types/[memberTypeId] - Success');
    return success(res, { data: null, message: 'Member type deleted successfully' });
  },
];
