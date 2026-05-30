import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findUniqueModule, updateModule, deleteModule } from '@src/features/training/services';
import { UpdateTrainingModuleSchema } from '@src/features/training/validators/training';
import { NotFoundError } from '@src/shared/errors';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';
import { z } from 'zod';

const TrainingParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

export const getModule = [
  validate({ params: TrainingParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'GET /training/modules/{moduleId} - Request started');
    await withRole(req, UserRole.MEMBER);
    logger.info({ traceId }, 'GET /training/modules/{moduleId} - User authorized');

    const trainingModule = await findUniqueModule({ associationId: association.id, moduleId: req.params.moduleId });
    if (!trainingModule) throw new NotFoundError('Training module not found');

    logger.info({ traceId, moduleId: req.params.moduleId }, 'GET /training/modules/{moduleId} - Success');
    return success(res, { data: trainingModule });
  },
];

export const updateModuleHandler = [
  validate({ params: TrainingParamsSchema, body: UpdateTrainingModuleSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'PATCH /training/modules/{moduleId} - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'PATCH /training/modules/{moduleId} - User authorized');

    const trainingModule = await updateModule({
      associationId: association.id,
      moduleId: req.params.moduleId,
      actorId: user.id,
      data: req.body,
    });

    logger.info({ traceId, moduleId: req.params.moduleId }, 'PATCH /training/modules/{moduleId} - Success');
    return success(res, { data: trainingModule });
  },
];

export const deleteModuleHandler = [
  validate({ params: TrainingParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'DELETE /training/modules/{moduleId} - Request started');
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'DELETE /training/modules/{moduleId} - User authorized');

    await deleteModule({ associationId: association.id, moduleId: req.params.moduleId, actorId: user.id });

    logger.info({ traceId, moduleId: req.params.moduleId }, 'DELETE /training/modules/{moduleId} - Success');
    return success(res, { data: { success: true } });
  },
];
