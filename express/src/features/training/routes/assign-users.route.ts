import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import {
  assignTraining,
  bulkAssignTraining,
  removeTrainingAssignment,
  bulkRemoveTrainingAssignment,
  getTrainingAssignments,
  getAssignedUsers,
} from '@src/features/training/services';
import {
  AssignTrainingSchema,
  BulkAssignTrainingSchema,
} from '@src/features/training/validators/training';
import { buildPagination } from '@src/shared/utils/build-pagination';
import { BadRequestError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';
import { z } from 'zod';

const ParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

const RemoveAssignSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const BulkRemoveAssignSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID')).min(1, 'At least one user is required'),
});

export const getAssignments = [
  validate({ params: ParamsSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /training/modules/{moduleId}/assign - Request started');
    await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assign - User authorized');

    const page = parseInt(req.query.page as string) || 1;
    const result = await getTrainingAssignments({ associationId: association.id, moduleId: req.params.moduleId, page });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assign - Success');
    return success(res, { data: result.data, meta: buildPagination(result.total, page) });
  },
];

export const postAssign = [
  validate({ params: ParamsSchema, body: AssignTrainingSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /training/modules/{moduleId}/assign - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'POST /training/modules/{moduleId}/assign - User authorized');

    try {
      const assignment = await assignTraining({
        associationId: association.id,
        moduleId: req.params.moduleId,
        userId: req.body.userId,
        assignedById: user.id,
      });
      logger.info({ traceId, userId: req.body.userId }, 'POST /training/modules/{moduleId}/assign - Success');
      return success(res, { data: assignment }, 201);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to assign training');
    }
  },
];

export const putBulkAssign = [
  validate({ params: ParamsSchema, body: BulkAssignTrainingSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'PUT /training/modules/{moduleId}/assign - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'PUT /training/modules/{moduleId}/assign - User authorized');

    try {
      const result = await bulkAssignTraining({
        associationId: association.id,
        moduleId: req.params.moduleId,
        userIds: req.body.userIds,
        assignedById: user.id,
      });
      logger.info({ traceId, userCount: req.body.userIds.length }, 'PUT /training/modules/{moduleId}/assign - Success');
      return success(res, { data: result }, 201);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to bulk assign training');
    }
  },
];

export const deleteAssignment = [
  validate({ params: ParamsSchema, body: RemoveAssignSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'DELETE /training/modules/{moduleId}/assign - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'DELETE /training/modules/{moduleId}/assign - User authorized');

    try {
      const result = await removeTrainingAssignment({
        associationId: association.id,
        moduleId: req.params.moduleId,
        userId: req.body.userId,
        removedById: user.id,
      });
      logger.info({ traceId, userId: req.body.userId }, 'DELETE /training/modules/{moduleId}/assign - Success');
      return success(res, { data: result });
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to remove training assignment');
    }
  },
];

export const patchBulkRemove = [
  validate({ params: ParamsSchema, body: BulkRemoveAssignSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'PATCH /training/modules/{moduleId}/assign - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'PATCH /training/modules/{moduleId}/assign - User authorized');

    try {
      const result = await bulkRemoveTrainingAssignment({
        associationId: association.id,
        moduleId: req.params.moduleId,
        userIds: req.body.userIds,
        removedById: user.id,
      });
      logger.info({ traceId, userCount: req.body.userIds.length }, 'PATCH /training/modules/{moduleId}/assign - Success');
      return success(res, { data: result });
    } catch (error) {
      if (error instanceof Error) throw new BadRequestError(error.message);
      throw new BadRequestError('Failed to bulk remove training assignments');
    }
  },
];

export const getAssignedUsersHandler = [
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /training/modules/{moduleId}/assigned-users - Request started');
    await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - User authorized');

    const page = parseInt(req.query.page as string) || 1;
    const result = await getAssignedUsers({ associationId: association.id, moduleId: req.params.moduleId, page });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/assigned-users - Success');
    return success(res, { data: result.data, meta: buildPagination(result.total, page) });
  },
];
