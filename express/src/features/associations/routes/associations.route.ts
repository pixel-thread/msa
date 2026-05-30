import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { createAssociation } from '@src/features/associations/services/createAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import {
  CreateAssociationSchema,
  UpdateAssociationSchema,
} from '@src/features/associations/validators';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { logger } from '@src/shared/logger';
import { z } from 'zod';
import type { CreateAssociationInput } from '@validator/associations';
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for adding a member to an association. */
const BodySchema = z.object({
  memberId: z.string(),
});

/** GET /api/associations - Retrieve the current user's association. */
export const getAssociationByUser: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId }, 'GET /api/associations - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations - User authorized',
    );
    logger.info({ traceId, associationId: association.id }, 'GET /api/associations - Success');
    return success(res, { data: association });
  }),
];

/** POST /api/associations - Create a new association (Super Admin only). */
export const postAssociationCreate: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info({ traceId, name: req.body?.name }, 'POST /api/associations - Request started');
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations - User authorized',
    );
    const existing = await findFirstAssociation({
      where: {
        OR: [
          { slug: req.body?.slug, status: 'ACTIVE' },
          { name: req.body?.name, status: 'ACTIVE' },
        ],
      },
      take: 1,
    });
    if (existing) {
      logger.error(
        { traceId, slug: req.body?.slug, name: req.body?.name },
        'POST /api/associations - Association Already Exists',
      );
      throw new ConflictError('Association Already Exists');
    }
    const association = await createAssociation({ data: req.body as CreateAssociationInput });
    logger.info({ traceId, associationId: association.id }, 'POST /api/associations - Success');
    return success(res, { data: association, message: 'Association created successfully' }, 201);
  }),
];

/** GET /api/associations/current - Retrieve details of the current user's association. */
export const getCurrentAssociation: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId }, 'GET /api/associations/current - Request started');
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations/current - User authorized',
    );
    const currentAssociation = await findUniqueAssociation({ where: { id: association.id } });
    logger.info(
      { traceId, associationId: association.id },
      'GET /api/associations/current - Success',
    );
    return success(res, { data: currentAssociation });
  }),
];

/** GET /api/associations/:associationId - Retrieve a single association by ID. */
export const getAssociationDetail: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, associationId: req.params.associationId as string },
      'GET /api/associations/[associationId] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations/[associationId] - User authorized',
    );
    const association = await findUniqueAssociation({
      where: { id: req.params.associationId as string },
    });
    if (!association) {
      logger.error(
        { traceId, associationId: req.params.associationId as string },
        'GET /api/associations/[associationId] - Association not found',
      );
      throw new NotFoundError('Association not found');
    }
    logger.info(
      { traceId, associationId: req.params.associationId as string },
      'GET /api/associations/[associationId] - Success',
    );
    return success(res, { data: association, message: 'Association found successfully' });
  }),
];

/** PATCH /api/associations/:associationId - Update an existing association. */
export const patchAssociationDetail: RequestHandler[] = [
  validate({ body: UpdateAssociationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, associationId: req.params.associationId as string },
      'PATCH /api/associations/[associationId] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PATCH /api/associations/[associationId] - User authorized',
    );
    const existing = await findUniqueAssociation({
      where: { id: req.params.associationId as string },
    });
    if (!existing) {
      logger.error(
        { traceId, associationId: req.params.associationId as string },
        'PATCH /api/associations/[associationId] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }
    if (req.body?.slug !== existing.slug || req.body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: req.params.associationId as string },
          OR: [{ slug: req.body?.slug }, { name: req.body?.name }],
        },
        take: 1,
      });
      if (conflict) {
        logger.error(
          { traceId, slug: req.body?.slug, name: req.body?.name },
          'PATCH /api/associations/[associationId] - Association conflict',
        );
        throw new ConflictError('Association with this slug or name already exists');
      }
    }
    const updated = await updateAssociation({
      where: { id: req.params.associationId as string },
      data: req.body as CreateAssociationInput,
    });
    logger.info(
      { traceId, associationId: req.params.associationId as string },
      'PATCH /api/associations/[associationId] - Success',
    );
    return success(res, { data: updated, message: 'Association updated successfully' }, 200);
  }),
];

/** POST /api/associations/:associationId/deactivate - Deactivate an association (soft-disable). */
export const postDeactivateAssociation: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, associationId: req.params.associationId as string },
      'POST /api/associations/[associationId]/deactivate - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/deactivate - User authorized',
    );
    const userId = req.userId as string;
    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Unauthorized (missing x-user-id header)',
      );
      throw new UnauthorizedError('Unauthorized');
    }
    const associationId = req.params.associationId as string;
    if (!associationId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Association ID is required',
      );
      throw new UnauthorizedError('Association ID is required');
    }
    const isAssociationExist = await findUniqueAssociation({ where: { id: associationId } });
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
    return success(res, {
      data: updatedAssociation,
      message: 'Association deactivated successfully',
    });
  }),
];

/** POST /api/associations/:associationId/logo - Upload a logo image for the association. */
export const postUploadLogo: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations/[associationId]/logo - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id },
      'POST /api/associations/[associationId]/logo - User authorized',
    );
    const existing = await prisma.association.findUnique({ where: { id: association.id } });
    if (!existing) {
      logger.error(
        { traceId, associationId: association.id },
        'POST /api/associations/[associationId]/logo - Association not found',
      );
      throw new NotFoundError('Association not found');
    }
    const file = (req as any).file || (req as any).files?.logo;
    const uploadResult = await uploadToBucket(
      file,
      `associations/logos/${association.slug}`,
      traceId,
    );
    await prisma.association.update({
      where: { id: association.id },
      data: { logo: uploadResult.url },
    });
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations/[associationId]/logo - Success',
    );
    return success(
      res,
      {
        data: { key: uploadResult.key, url: uploadResult.url },
        message: 'Logo uploaded successfully',
      },
      201,
    );
  }),
];

/** POST /api/associations/:associationId/members - Add an existing member to the association. */
export const postAddMember: RequestHandler[] = [
  validate({ body: BodySchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      {
        traceId,
        targetMemberId: req.body?.memberId,
        associationId: req.params.associationId as string,
      },
      'POST /api/associations/[associationId]/members - Request started',
    );
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/members - User authorized',
    );
    if (!req.body?.memberId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/members - memberId is required',
      );
      throw new ValidationError('memberId is required');
    }
    const existingMember = await findUniqueMember({ where: { id: req.body.memberId } });
    if (!existingMember) {
      logger.error(
        { traceId, targetMemberId: req.body.memberId },
        'POST /api/associations/[associationId]/members - Member not found',
      );
      throw new NotFoundError('Member not found');
    }
    if (existingMember.associationId === (req.params.associationId as string)) {
      logger.error(
        {
          traceId,
          targetMemberId: req.body.memberId,
          associationId: req.params.associationId as string,
        },
        'POST /api/associations/[associationId]/members - Member already in this association',
      );
      throw new ConflictError('Member already in this association');
    }
    const updatedMember = await updateMember({
      where: { id: req.body.memberId },
      data: { association: { connect: { id: association.id } } },
    });
    logger.info(
      { traceId, targetMemberId: req.body.memberId, associationId: association.id },
      'POST /api/associations/[associationId]/members - Success',
    );
    return success(res, { data: updatedMember }, 201);
  }),
];
