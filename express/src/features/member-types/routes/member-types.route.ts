import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { BadRequestError, ForbiddenError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { getAssociation, withRole } from '@src/features/meetings/routes/_helpers';
import { logger } from '@src/shared/logger';

let findManyMemberTypes: any;
let createMemberType: any;
let findUniqueMemberType: any;
let updateMemberType: any;
let deleteMemberType: any;
let CreateMemberTypeSchema: any;
let UpdateMemberTypeSchema: any;
let MemberTypeParamsSchema: any;

try {
  const memberTypeServices = require('@feature/member-type/services');
  findManyMemberTypes = memberTypeServices.findManyMemberTypes;
  createMemberType = memberTypeServices.createMemberType;
  findUniqueMemberType = memberTypeServices.findUniqueMemberType;
  updateMemberType = memberTypeServices.updateMemberType;
  deleteMemberType = memberTypeServices.deleteMemberType;
  const memberTypeValidators = require('@feature/member-type/validators');
  CreateMemberTypeSchema = memberTypeValidators.CreateMemberTypeSchema;
  UpdateMemberTypeSchema = memberTypeValidators.UpdateMemberTypeSchema;
  MemberTypeParamsSchema = memberTypeValidators.MemberTypeParamsSchema;
} catch {
  // services and validators not yet created
}

export const getMemberTypes = [
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /api/member-types - Request started');
      const user = await withRole(req, UserRole.MEMBER);
      logger.info({ traceId, userId: user.id }, 'GET /api/member-types - User authorized');
      const memberTypes = findManyMemberTypes ? await findManyMemberTypes({ associationId: association.id }) : [];
      logger.info({ traceId, count: memberTypes.length }, 'GET /api/member-types - Success');
      return success(res, { data: memberTypes });
    } catch (e) { next(e); }
  },
];

export const postMemberType = [
  ...(CreateMemberTypeSchema ? [validate({ body: CreateMemberTypeSchema })] : []),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'POST /api/member-types - Request started');
      if (!req.body) throw new BadRequestError('Invalid request body');
      const user = await withRole(req, UserRole.PRESIDENT);
      logger.info({ traceId, userId: user.id }, 'POST /api/member-types - User authorized');
      const memberType = createMemberType
        ? await createMemberType({ associationId: association.id, actorId: user.id, data: req.body })
        : {};
      logger.info({ traceId, memberTypeId: memberType.id }, 'POST /api/member-types - Success');
      return success(res, { data: memberType }, 201);
    } catch (e) { next(e); }
  },
];

export const getMemberTypeById = [
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /api/member-types/[memberTypeId] - Request started');
      if (!req.params.memberTypeId) throw new BadRequestError('Invalid member type ID');
      const user = await withRole(req, UserRole.MEMBER);
      logger.info({ traceId, userId: user.id }, 'GET /api/member-types/[memberTypeId] - User authorized');
      const { memberTypeId } = req.params;
      const memberType = findUniqueMemberType
        ? await findUniqueMemberType({ associationId: association.id, memberTypeId })
        : null;
      if (!memberType) throw new NotFoundError('Member type not found');
      logger.info({ traceId, memberTypeId }, 'GET /api/member-types/[memberTypeId] - Success');
      return success(res, { data: memberType, message: 'Member type found' });
    } catch (e) { next(e); }
  },
];

export const patchMemberType = [
  ...(UpdateMemberTypeSchema ? [validate({ body: UpdateMemberTypeSchema })] : []),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'PATCH /api/member-types/[memberTypeId] - Request started');
      if (!req.params.memberTypeId) throw new ForbiddenError('Invalid member type ID');
      if (!req.body) throw new ForbiddenError('Invalid request body');
      const user = await withRole(req, UserRole.PRESIDENT);
      logger.info({ traceId, userId: user.id }, 'PATCH /api/member-types/[memberTypeId] - User authorized');
      const { memberTypeId } = req.params;
      const memberType = updateMemberType
        ? await updateMemberType({ associationId: association.id, actorId: user.id, memberTypeId, data: req.body })
        : {};
      logger.info({ traceId, memberTypeId }, 'PATCH /api/member-types/[memberTypeId] - Success');
      return success(res, { data: memberType, message: 'Member type updated successfully' });
    } catch (e) { next(e); }
  },
];

export const deleteMemberType = [
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'DELETE /api/member-types/[memberTypeId] - Request started');
      if (!req.params.memberTypeId) throw new ForbiddenError('Invalid member type ID');
      const user = await withRole(req, UserRole.PRESIDENT);
      logger.info({ traceId, userId: user.id }, 'DELETE /api/member-types/[memberTypeId] - User authorized');
      const { memberTypeId } = req.params;
      if (deleteMemberType) {
        await deleteMemberType({ associationId: association.id, actorId: user.id, memberTypeId });
      }
      logger.info({ traceId, memberTypeId }, 'DELETE /api/member-types/[memberTypeId] - Success');
      return success(res, { data: null, message: 'Member type deleted successfully' });
    } catch (e) { next(e); }
  },
];
