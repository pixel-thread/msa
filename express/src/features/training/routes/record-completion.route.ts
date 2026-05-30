// ---- External libs ----
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---- Shared utilities ----
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Prisma ----
import { UserRole } from '@prisma/client';

// ---- Services ----
import { findManyCompletions, adminRecordCompletion } from '@src/features/training/services';

// ---- Validators ----
import { AdminRecordCompletionSchema } from '@src/features/training/validators/training';

// ---------------------------------------------------------------------------
// GET /training/completions
// Description: List all completions with optional filters (moduleId, userId)
// Security:    SECRETARY role required
// ---------------------------------------------------------------------------

export const getCompletions: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/completions - Request started',
    );

    // Authorize: SECRETARY role required (admin view)
    await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId }, 'GET /training/completions - User authorized');

    // Parse optional query filters
    const page = parseInt(req.query.page as string) || 1;
    const moduleId = req.query.moduleId as string | undefined;
    const userId = req.query.userId as string | undefined;

    // Fetch filtered completions
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

// ---------------------------------------------------------------------------
// POST /training/completions
// Description: Admin record a completion for a user
// Security:    SECRETARY role required
// ---------------------------------------------------------------------------

export const postCompletion: RequestHandler[] = [
  validate({ body: AdminRecordCompletionSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/completions - Request started',
    );

    // Authorize: SECRETARY role required
    const admin = await withRole(req, UserRole.SECRETARY);

    logger.info({ traceId, userId: admin.id }, 'POST /training/completions - User authorized');

    // Record the completion on behalf of the user
    const completion = await adminRecordCompletion({
      associationId: association.id,
      actorId: admin.id,
      data: req.body,
    });

    logger.info({ traceId, completionId: completion.id }, 'POST /training/completions - Success');
    return success(res, { data: completion }, 201);
  }),
];
