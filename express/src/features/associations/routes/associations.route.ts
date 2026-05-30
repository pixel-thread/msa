/**
 * @file Associations Route Handlers
 * @description This file contains the request handlers for the associations feature.
 * It provides operations for viewing, creating, updating, and managing associations.
 */

import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

import { UserRole } from '@prisma/client';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { getAssociation } from '@src/shared/services/association/get-association';

import { createAssociation } from '@src/features/associations/services/createAssociation';
import { findFirstAssociation } from '@src/features/associations/services/findFirstAssociation';
import { findUniqueAssociation } from '@src/features/associations/services/findUniqueAssociation';
import { updateAssociation } from '@src/features/associations/services/updateAssociation';
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';
import { updateMember } from '@src/features/members/services/updateMember';
import {
  CreateAssociationSchema,
  UpdateAssociationSchema,
} from '@src/features/associations/validators';
import type { CreateAssociationInput } from '@validator/associations';

/**
 * Local schema for adding a member to an association.
 */
const BodySchema = z.object({
  memberId: z.string(),
});

/**
 * @description Retrieve the current user's association.
 * @security MEMBER role required.
 * @route GET /api/associations
 */
export const getAssociationByUser: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve the association from the request context
    const association = await getAssociation(req);

    logger.info({ traceId }, 'GET /api/associations - Request started');

    // Enforce MEMBER role — any authenticated member can view their association
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations - User authorized',
    );

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/associations - Success',
    );

    return success(res, { data: association });
  }),
];

/**
 * @description Create a new association. Slug and name must be unique among active records.
 * @security SUPER_ADMIN role required.
 * @route POST /api/associations
 */
export const postAssociationCreate: RequestHandler[] = [
  validate({ body: CreateAssociationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    logger.info(
      { traceId, name: req.body?.name },
      'POST /api/associations - Request started',
    );

    // Enforce SUPER_ADMIN role — only super admins can create associations
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations - User authorized',
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
        'POST /api/associations - Association Already Exists',
      );

      throw new ConflictError('Association Already Exists');
    }

    // Persist the new association
    const association = await createAssociation({
      data: req.body as CreateAssociationInput,
    });

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations - Success',
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
 * @description Retrieve details of the current user's association.
 * @security MEMBER role required.
 * @route GET /api/associations/current
 */
export const getCurrentAssociation: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve the association from the request context
    const association = await getAssociation(req);

    logger.info({ traceId }, 'GET /api/associations/current - Request started');

    // Enforce MEMBER role
    const user = await withRole(req, UserRole.MEMBER);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations/current - User authorized',
    );

    // Fetch full association details including relations
    const currentAssociation = await findUniqueAssociation({
      where: { id: association.id },
    });

    logger.info(
      { traceId, associationId: association.id },
      'GET /api/associations/current - Success',
    );

    return success(res, { data: currentAssociation });
  }),
];

/**
 * @description Retrieve a single association by ID.
 * @security SUPER_ADMIN role required.
 * @route GET /api/associations/:associationId
 */
export const getAssociationDetail: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.associationId as string;

    logger.info(
      { traceId, associationId },
      'GET /api/associations/[associationId] - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/associations/[associationId] - User authorized',
    );

    // Look up the association by primary key
    const association = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!association) {
      logger.error(
        { traceId, associationId },
        'GET /api/associations/[associationId] - Association not found',
      );

      throw new NotFoundError('Association not found');
    }

    logger.info(
      { traceId, associationId },
      'GET /api/associations/[associationId] - Success',
    );

    return success(res, {
      data: association,
      message: 'Association found successfully',
    });
  }),
];

/**
 * @description Update an existing association. Checks for slug/name collisions with other records.
 * @security SUPER_ADMIN role required.
 * @route PATCH /api/associations/:associationId
 */
export const patchAssociationDetail: RequestHandler[] = [
  validate({ body: UpdateAssociationSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.associationId as string;

    logger.info(
      { traceId, associationId },
      'PATCH /api/associations/[associationId] - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'PATCH /api/associations/[associationId] - User authorized',
    );

    // Verify the association exists before attempting updates
    const existing = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!existing) {
      logger.error(
        { traceId, associationId },
        'PATCH /api/associations/[associationId] - Association Not Found',
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
          'PATCH /api/associations/[associationId] - Association conflict',
        );

        throw new ConflictError('Association with this slug or name already exists');
      }
    }

    // Apply the update
    const updated = await updateAssociation({
      where: { id: associationId },
      data: req.body as CreateAssociationInput,
    });

    logger.info(
      { traceId, associationId },
      'PATCH /api/associations/[associationId] - Success',
    );

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
 * @description Deactivate an association (soft-disable).
 * @security SUPER_ADMIN role required.
 * @route POST /api/associations/:associationId/deactivate
 */
export const postDeactivateAssociation: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const associationId = req.params.associationId as string;

    logger.info(
      { traceId, associationId },
      'POST /api/associations/[associationId]/deactivate - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/deactivate - User authorized',
    );

    // Reviewer identity comes from the x-user-id header
    const userId = req.userId as string;

    if (!userId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Unauthorized (missing x-user-id header)',
      );

      throw new UnauthorizedError('Unauthorized');
    }

    if (!associationId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/deactivate - Association ID is required',
      );

      throw new UnauthorizedError('Association ID is required');
    }

    // Confirm the association exists before deactivation
    const isAssociationExist = await findUniqueAssociation({
      where: { id: associationId },
    });

    if (!isAssociationExist) {
      logger.error(
        { traceId, associationId },
        'POST /api/associations/[associationId]/deactivate - Association not found',
      );

      throw new Error('Association not found');
    }

    // Perform soft-disable
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

/**
 * @description Upload a logo image for the association.
 * @security SUPER_ADMIN role required.
 * @route POST /api/associations/:associationId/logo
 */
export const postUploadLogo: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve the association from the request context
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations/[associationId]/logo - Request started',
    );

    // Enforce SUPER_ADMIN role
    const user = await withRole(req, UserRole.SUPER_ADMIN);

    logger.info(
      { traceId, userId: user.id },
      'POST /api/associations/[associationId]/logo - User authorized',
    );

    // Confirm the association record exists
    const existing = await prisma.association.findUnique({
      where: { id: association.id },
    });

    if (!existing) {
      logger.error(
        { traceId, associationId: association.id },
        'POST /api/associations/[associationId]/logo - Association not found',
      );

      throw new NotFoundError('Association not found');
    }

    // Extract the uploaded file from the request
    const file = (req as any).file || (req as any).files?.logo;

    // Upload to object storage under the association's slug
    const uploadResult = await uploadToBucket(
      file,
      `associations/logos/${association.slug}`,
      traceId,
    );

    // Persist the logo URL on the association record
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
        data: {
          key: uploadResult.key,
          url: uploadResult.url,
        },
        message: 'Logo uploaded successfully',
      },
      201,
    );
  }),
];

/**
 * @description Add an existing member to the association. Guards against duplicate assignment.
 * @security PRESIDENT role required.
 * @route POST /api/associations/:associationId/members
 */
export const postAddMember: RequestHandler[] = [
  validate({ body: BodySchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve the association from the request context
    const association = await getAssociation(req);

    logger.info(
      {
        traceId,
        targetMemberId: req.body?.memberId,
        associationId: req.params.associationId as string,
      },
      'POST /api/associations/[associationId]/members - Request started',
    );

    // Enforce PRESIDENT role — only presidents and above may add members
    const user = await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'POST /api/associations/[associationId]/members - User authorized',
    );

    // Guard against missing memberId
    if (!req.body?.memberId) {
      logger.error(
        { traceId },
        'POST /api/associations/[associationId]/members - memberId is required',
      );

      throw new ValidationError('memberId is required');
    }

    // Verify the target member exists
    const existingMember = await findUniqueMember({
      where: { id: req.body.memberId },
    });

    if (!existingMember) {
      logger.error(
        { traceId, targetMemberId: req.body.memberId },
        'POST /api/associations/[associationId]/members - Member not found',
      );

      throw new NotFoundError('Member not found');
    }

    // Prevent adding a member who already belongs to this association
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

    // Reassign the member to the new association
    const updatedMember = await updateMember({
      where: { id: req.body.memberId },
      data: { association: { connect: { id: association.id } } },
    });

    logger.info(
      {
        traceId,
        targetMemberId: req.body.memberId,
        associationId: association.id,
      },
      'POST /api/associations/[associationId]/members - Success',
    );

    return success(res, { data: updatedMember }, 201);
  }),
];
