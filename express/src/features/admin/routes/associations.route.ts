import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { findManyAssociation } from '@src/features/associations/services/findManyAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { createAssociation } from '@src/features/associations/services/createAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { deleteAssociation } from '@src/features/associations/services/deleteAssociation';
import { CreateAssociationSchema } from '@src/features/associations/validators';
import { AddAssociationMemberSchema } from '@src/features/associations/validators/associations';
import { logger } from '@src/shared/logger';
import type { CreateAssociationInput } from '@validator/associations';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /api/admin/associations - Retrieve all active associations. */
export const getAssociations: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
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
    return success(res, { data: data.associations, meta: data.pagination });
  }),
];

/** POST /api/admin/associations - Create a new association. */
export const postAssociation: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, name: req.body?.name },
      'POST /api/admin/associations - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations - User authorized',
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
        'POST /api/admin/associations - Association Already Exists',
      );
      throw new ConflictError('Association Already Exists');
    }
    const association = await createAssociation({
      data: req.body as CreateAssociationInput,
    });
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/admin/associations - Success',
    );
    return success(res, { data: association, message: 'Association created successfully' }, 201);
  }),
];

/** GET /api/admin/associations/:id - Retrieve a single association by ID. */
export const getAssociationById: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, id: req.params.id },
      'GET /api/admin/associations/[id] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/associations/[id] - User authorized',
    );
    const association = await findUniqueAssociation({
      where: { id: req.params.id as string },
    });
    if (!association) {
      logger.error(
        { traceId, id: req.params.id },
        'GET /api/admin/associations/[id] - Association not found',
      );
      throw new NotFoundError('Association not found');
    }
    logger.info({ traceId, id: req.params.id }, 'GET /api/admin/associations/[id] - Success');
    return success(res, { data: association, message: 'Association found successfully' });
  }),
];

/** PUT /api/admin/associations/:id - Update an existing association. */
export const putAssociation: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, id: req.params.id, name: req.body?.name },
      'PUT /api/admin/associations/[id] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PUT /api/admin/associations/[id] - User authorized',
    );
    const existing = await findUniqueAssociation({
      where: { id: req.params.id as string },
    });
    if (!existing) {
      logger.error(
        { traceId, id: req.params.id },
        'PUT /api/admin/associations/[id] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }
    if (req.body?.slug !== existing.slug || req.body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: req.params.id as string },
          OR: [{ slug: req.body?.slug }, { name: req.body?.name }],
        },
        take: 1,
      });
      if (conflict) {
        logger.error(
          { traceId, slug: req.body?.slug, name: req.body?.name },
          'PUT /api/admin/associations/[id] - Association conflict',
        );
        throw new ConflictError('Association with this slug or name already exists');
      }
    }
    const updated = await updateAssociation({
      where: { id: req.params.id as string },
      data: req.body as CreateAssociationInput,
    });
    logger.info({ traceId, id: req.params.id }, 'PUT /api/admin/associations/[id] - Success');
    return success(res, { data: updated, message: 'Association updated successfully' }, 200);
  }),
];

/** DELETE /api/admin/associations/:id - Soft-delete an association. */
export const deleteAssociationById: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, id: req.params.id },
      'DELETE /api/admin/associations/[id] - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'DELETE /api/admin/associations/[id] - User authorized',
    );
    const existing = await findUniqueAssociation({
      where: { id: req.params.id as string },
    });
    if (!existing) {
      logger.error(
        { traceId, id: req.params.id },
        'DELETE /api/admin/associations/[id] - Association Not Found',
      );
      throw new NotFoundError('Association Not Found');
    }
    const deleted = await deleteAssociation({
      id: req.params.id as string,
    });
    logger.info({ traceId, id: req.params.id }, 'DELETE /api/admin/associations/[id] - Success');
    return success(res, { data: deleted, message: 'Association deleted successfully' }, 200);
  }),
];

/** POST /api/admin/associations/:id/member - Assign a user to an association. */
export const postAssociationMember: RequestHandler[] = [
  validate({ body: AddAssociationMemberSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, targetUserId: req.body?.user_id, targetAssociationId: req.body?.association_id },
      'POST /api/admin/associations/[id]/member - Request started',
    );
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations/[id]/member - User authorized',
    );
    const [targetUser, association] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.body?.user_id } }),
      prisma.association.findUnique({ where: { id: req.body?.association_id } }),
    ]);
    if (!targetUser) {
      logger.error(
        { traceId, targetUserId: req.body?.user_id },
        'POST /api/admin/associations/[id]/member - User not found',
      );
      throw new NotFoundError('User not found');
    }
    if (!association) {
      logger.error(
        { traceId, targetAssociationId: req.body?.association_id },
        'POST /api/admin/associations/[id]/member - Association not found',
      );
      throw new NotFoundError('Association not found');
    }
    if (req.body?.association_id === targetUser.associationId) {
      logger.error(
        { traceId, targetUserId: req.body?.user_id, associationId: req.body?.association_id },
        'POST /api/admin/associations/[id]/member - User already under the target association',
      );
      throw new ConflictError('User already under the target association');
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.body?.user_id },
      data: { association: { connect: { id: req.body?.association_id } } },
      select: { id: true, role: true, associationId: true, email: true, name: true },
    });
    logger.info(
      { traceId, targetUserId: req.body?.user_id, associationId: req.body?.association_id },
      'POST /api/admin/associations/[id]/member - Success',
    );
    return success(res, { data: updatedUser, message: 'User association change successfully' });
  }),
];
