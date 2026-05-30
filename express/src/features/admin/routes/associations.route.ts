/**
 * @file Associations Route Handlers
 * @description This file contains the request handlers for managing associations in the admin panel.
 * It provides CRUD operations and member assignment for associations.
 */

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { UserRole } from '@prisma/client';

import { validate } from '@src/shared/lib/validate';
import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { ConflictError, NotFoundError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';

import { findManyAssociation } from '@src/features/associations/services/findManyAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { createAssociation } from '@src/features/associations/services/createAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { deleteAssociation } from '@src/features/associations/services/deleteAssociation';
import { CreateAssociationSchema } from '@src/features/associations/validators';
import { AddAssociationMemberSchema } from '@src/features/associations/validators/associations';
import type { CreateAssociationInput } from '@validator/associations';

/**
 * @description Retrieve all active associations, newest first.
 * @security SUPER_ADMIN role required.
 * @route GET /api/admin/associations
 */
export const getAssociations: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info({ traceId }, 'GET /api/admin/associations - Request started');

    // Enforce SUPER_ADMIN role — only super admins can list associations
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/associations - User authorized',
    );

    // Fetch active associations, ordered by creation date descending
    const data = await findManyAssociation({
      orderBy: { createdAt: 'desc' },
      where: { status: 'ACTIVE' },
    });

    logger.info(
      { traceId, count: data.associations.length },
      'GET /api/admin/associations - Success',
    );

    return success(res, {
      data: data.associations,
      meta: data.pagination,
    });
  }),
];

/**
 * @description Create a new association. Slug and name must be unique among active records.
 * @security SUPER_ADMIN role required.
 * @route POST /api/admin/associations
 */
export const postAssociation: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info(
      { traceId, name: req.body?.name },
      'POST /api/admin/associations - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations - User authorized',
    );

    // Prevent duplicate associations — check slug or name collision against active records
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

    // Persist the new association
    const association = await createAssociation({
      data: req.body as CreateAssociationInput,
    });

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/admin/associations - Success',
    );

    return success(
      res,
      {
        data: association,
        message: 'Association created successfully',
      },
      201,
    );
  }),
];

/**
 * @description Retrieve a single association by its ID.
 * @security SUPER_ADMIN role required.
 * @route GET /api/admin/associations/:id
 */
export const getAssociationById: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.id as string;

    logger.info(
      { traceId, id: associationId },
      'GET /api/admin/associations/[id] - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/admin/associations/[id] - User authorized',
    );

    // Look up the association by primary key
    const association = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!association) {
      logger.error(
        { traceId, id: associationId },
        'GET /api/admin/associations/[id] - Association not found',
      );

      throw new NotFoundError('Association not found');
    }

    logger.info({ traceId, id: associationId }, 'GET /api/admin/associations/[id] - Success');

    return success(res, {
      data: association,
      message: 'Association found successfully',
    });
  }),
];

/**
 * @description Update an existing association. Checks for slug/name collisions with other records.
 * @security SUPER_ADMIN role required.
 * @route PUT /api/admin/associations/:id
 */
export const putAssociation: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.id as string;

    logger.info(
      { traceId, id: associationId, name: req.body?.name },
      'PUT /api/admin/associations/[id] - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PUT /api/admin/associations/[id] - User authorized',
    );

    // Verify the association exists before attempting updates
    const existing = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!existing) {
      logger.error(
        { traceId, id: associationId },
        'PUT /api/admin/associations/[id] - Association Not Found',
      );

      throw new NotFoundError('Association Not Found');
    }

    // If slug or name changed, check for conflicts with other active associations
    if (req.body?.slug !== existing.slug || req.body?.name !== existing.name) {
      const conflict = await findFirstAssociation({
        where: {
          id: { not: associationId },
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

    // Apply the update
    const updated = await updateAssociation({
      where: { id: associationId },
      data: req.body as CreateAssociationInput,
    });

    logger.info({ traceId, id: associationId }, 'PUT /api/admin/associations/[id] - Success');

    return success(
      res,
      {
        data: updated,
        message: 'Association updated successfully',
      },
      200,
    );
  }),
];

/**
 * @description Soft-delete an association (sets status to inactive / removed).
 * @security SUPER_ADMIN role required.
 * @route DELETE /api/admin/associations/:id
 */
export const deleteAssociationById: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.id as string;

    logger.info(
      { traceId, id: associationId },
      'DELETE /api/admin/associations/[id] - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'DELETE /api/admin/associations/[id] - User authorized',
    );

    // Confirm the record exists before deletion
    const existing = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!existing) {
      logger.error(
        { traceId, id: associationId },
        'DELETE /api/admin/associations/[id] - Association Not Found',
      );

      throw new NotFoundError('Association Not Found');
    }

    // Perform soft delete
    const deleted = await deleteAssociation({
      id: associationId,
    });

    logger.info({ traceId, id: associationId }, 'DELETE /api/admin/associations/[id] - Success');

    return success(
      res,
      {
        data: deleted,
        message: 'Association deleted successfully',
      },
      200,
    );
  }),
];

/**
 * @description Assign an existing user to an association. Guards against duplicate assignment.
 * @security SUPER_ADMIN role required.
 * @route POST /api/admin/associations/:id/member
 */
export const postAssociationMember: RequestHandler[] = [
  validate({ body: AddAssociationMemberSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info(
      {
        traceId,
        targetUserId: req.body?.user_id,
        targetAssociationId: req.body?.association_id,
      },
      'POST /api/admin/associations/[id]/member - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/admin/associations/[id]/member - User authorized',
    );

    // Resolve both the target user and the association in parallel
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

    // Prevent assigning a user who already belongs to this association
    if (req.body?.association_id === targetUser.associationId) {
      logger.error(
        {
          traceId,
          targetUserId: req.body?.user_id,
          associationId: req.body?.association_id,
        },
        'POST /api/admin/associations/[id]/member - User already under the target association',
      );

      throw new ConflictError('User already under the target association');
    }

    // Reassign the user to the new association
    const updatedUser = await prisma.user.update({
      where: { id: req.body?.user_id },
      data: { association: { connect: { id: req.body?.association_id } } },
      select: {
        id: true,
        role: true,
        associationId: true,
        email: true,
        name: true,
      },
    });

    logger.info(
      {
        traceId,
        targetUserId: req.body?.user_id,
        associationId: req.body?.association_id,
      },
      'POST /api/admin/associations/[id]/member - Success',
    );

    return success(res, {
      data: updatedUser,
      message: 'User association change successfully',
    });
  }),
];
