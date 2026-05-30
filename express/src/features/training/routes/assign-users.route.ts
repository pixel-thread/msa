// ---- External libs ----
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---- Shared utilities ----
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { BadRequestError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Prisma ----
import { UserRole } from '@prisma/client';

// ---- Services ----
import {
  assignTraining,
  bulkAssignTraining,
  removeTrainingAssignment,
  bulkRemoveTrainingAssignment,
  getTrainingAssignments,
  getAssignedUsers,
} from '@src/features/training/services';

// ---- Validators ----
import {
  AssignTrainingSchema,
  BulkAssignTrainingSchema,
} from '@src/features/training/validators/training';

// ---- External libs ----
import { z } from 'zod';

// ---- Schemas ----

/** Schema for module ID path parameter. */
const ParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

/** Schema for removing a single user assignment. */
const RemoveAssignSchema = z.object({
  userId: z.uuid('Invalid user ID'),
});

/** Schema for bulk removing user assignments. */
const BulkRemoveAssignSchema = z.object({
  userIds: z.array(z.uuid('Invalid user ID')).min(1, 'At least one user is required'),
});

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/assign
// Description: List assignments for a module
// Security:    SECRETARY role required
// ---------------------------------------------------------------------------

export const getAssignments: RequestHandler[] = [
  validate({ params: ParamsSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/assign - Request started',
    );

    // Authorize: SECRETARY role required
    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assign - User authorized');

    // Fetch paginated assignments
    const page = parseInt(req.query.page as string) || 1;
    const result = await getTrainingAssignments({
      associationId: association.id,
      moduleId: req.params.moduleId as string,
      page,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assign - Success');
    return success(res, { data: result.data, meta: buildPagination(result.total, page) });
  }),
];

// ---------------------------------------------------------------------------
// POST /training/modules/:moduleId/assign
// Description: Assign a user to a module
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const postAssign: RequestHandler[] = [
  validate({ params: ParamsSchema, body: AssignTrainingSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/modules/{moduleId}/assign - Request started',
    );

    // Authorize: DPO role required
    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id },
      'POST /training/modules/{moduleId}/assign - User authorized',
    );

    // Perform the assignment
    try {
      const assignment = await assignTraining({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
        userId: req.body.userId,
        assignedById: user.id,
      });

      logger.info(
        { traceId, userId: req.body.userId },
        'POST /training/modules/{moduleId}/assign - Success',
      );
      return success(res, { data: assignment }, 201);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to assign training');
    }
  }),
];

// ---------------------------------------------------------------------------
// PUT /training/modules/:moduleId/assign
// Description: Bulk assign users to a module
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const putBulkAssign: RequestHandler[] = [
  validate({ params: ParamsSchema, body: BulkAssignTrainingSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'PUT /training/modules/{moduleId}/assign - Request started',
    );

    // Authorize: DPO role required
    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id },
      'PUT /training/modules/{moduleId}/assign - User authorized',
    );

    // Perform bulk assignment
    try {
      const result = await bulkAssignTraining({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
        userIds: req.body.userIds,
        assignedById: user.id,
      });

      logger.info(
        { traceId, userCount: req.body.userIds.length },
        'PUT /training/modules/{moduleId}/assign - Success',
      );
      return success(res, { data: result }, 201);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to bulk assign training');
    }
  }),
];

// ---------------------------------------------------------------------------
// DELETE /training/modules/:moduleId/assign
// Description: Remove a user assignment
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const deleteAssignment: RequestHandler[] = [
  validate({ params: ParamsSchema, body: RemoveAssignSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'DELETE /training/modules/{moduleId}/assign - Request started',
    );

    // Authorize: DPO role required
    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id },
      'DELETE /training/modules/{moduleId}/assign - User authorized',
    );

    // Remove the assignment
    try {
      const result = await removeTrainingAssignment({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
        userId: req.body.userId,
        removedById: user.id,
      });

      logger.info(
        { traceId, userId: req.body.userId },
        'DELETE /training/modules/{moduleId}/assign - Success',
      );
      return success(res, { data: result });
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to remove training assignment');
    }
  }),
];

// ---------------------------------------------------------------------------
// PATCH /training/modules/:moduleId/assign
// Description: Bulk remove user assignments
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const patchBulkRemove: RequestHandler[] = [
  validate({ params: ParamsSchema, body: BulkRemoveAssignSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'PATCH /training/modules/{moduleId}/assign - Request started',
    );

    // Authorize: DPO role required
    const user = await withRole(req, UserRole.DPO);

    logger.info(
      { traceId, userId: user.id },
      'PATCH /training/modules/{moduleId}/assign - User authorized',
    );

    // Perform bulk removal
    try {
      const result = await bulkRemoveTrainingAssignment({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
        userIds: req.body.userIds,
        removedById: user.id,
      });

      logger.info(
        { traceId, userCount: req.body.userIds.length },
        'PATCH /training/modules/{moduleId}/assign - Success',
      );
      return success(res, { data: result });
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to bulk remove training assignments');
    }
  }),
];

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/assigned-users
// Description: List assigned users with completion status
// Security:    SECRETARY role required
// ---------------------------------------------------------------------------

export const getAssignedUsersHandler: RequestHandler[] = [
  validate({ params: ParamsSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/assigned-users - Request started',
    );

    // Authorize: SECRETARY role required
    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - User authorized');

    // Fetch paginated assigned users with completion data
    const page = parseInt(req.query.page as string) || 1;
    const result = await getAssignedUsers({
      associationId: association.id,
      moduleId: req.params.moduleId as string,
      page,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - Success');
    return success(res, { data: result.data, meta: buildPagination(result.total, page) });
  }),
];
