import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { createModule, findManyModules } from '@src/features/training/services';
import { CreateTrainingModuleSchema } from '@src/features/training/validators/training';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /training/modules - List training modules (scoped by user role). */
export const getModules: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules - Request started',
    );
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /training/modules - User authorized',
    );

    const isManager = hasHighRoleAccess(user.role) || user.role.includes(UserRole.DPO);
    const isActive = isManager ? undefined : true;
    const role = isManager ? undefined : user.role;
    const page = parseInt(req.query.page as string) || 1;

    if (hasHighRoleAccess(user.role)) {
      const modules = await findManyModules({
        associationId: association.id,
        isActive,
        role,
        page,
      });
      logger.info({ traceId }, 'GET /training/modules - Success');
      return success(res, { data: modules.trainingModules, meta: modules.pagination });
    }

    const modules = await findManyModules({
      associationId: association.id,
      userId: user.id,
      isActive,
      role,
      page,
    });
    logger.info({ traceId }, 'GET /training/modules - Success');
    return success(res, { data: modules.trainingModules, meta: modules.pagination });
  }),
];

/** POST /training/modules - Create a new training module (DPO role required). */
export const postModules: RequestHandler[] = [
  validate({ body: CreateTrainingModuleSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /training/modules - Request started',
    );
    const user = await withRole(req, UserRole.DPO);
    logger.info({ traceId, userId: user.id }, 'POST /training/modules - User authorized');

    const trainingModule = await createModule({
      associationId: association.id,
      actorId: user.id,
      data: req.body,
    });
    logger.info({ traceId, moduleId: trainingModule.id }, 'POST /training/modules - Success');
    return success(res, { data: trainingModule }, 201);
  }),
];
