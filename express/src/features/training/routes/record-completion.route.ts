import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { findManyCompletions, adminRecordCompletion } from '@src/features/training/services';
import { AdminRecordCompletionSchema } from '@src/features/training/validators/training';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET /training/completions - List all completions (SECRETARY role required, with optional filters). */
export const getCompletions: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /training/completions - Request started',
    );
    await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId }, 'GET /training/completions - User authorized');

    const page = parseInt(req.query.page as string) || 1;
    const moduleId = req.query.moduleId as string | undefined;
    const userId = req.query.userId as string | undefined;

    const data = await findManyCompletions({
      associationId: association.id,
      moduleId,
      userId,
      page,
    });

    logger.info({ traceId }, 'GET /training/completions - Success');
    return success(res, { data: data.completions, meta: data.pagination });
  }),
];

/** POST /training/completions - Admin record a completion for a user (SECRETARY role required). */
export const postCompletion: RequestHandler[] = [
  validate({ body: AdminRecordCompletionSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /training/completions - Request started',
    );
    const admin = await withRole(req, UserRole.SECRETARY);
    logger.info({ traceId, userId: admin.id }, 'POST /training/completions - User authorized');

    const completion = await adminRecordCompletion({
      associationId: association.id,
      actorId: admin.id,
      data: req.body,
    });

    logger.info({ traceId, completionId: completion.id }, 'POST /training/completions - Success');
    return success(res, { data: completion }, 201);
  }),
];
