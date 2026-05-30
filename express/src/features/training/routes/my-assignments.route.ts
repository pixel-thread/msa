// ---- External libs ----
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---- Shared utilities ----
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Prisma ----
import { UserRole } from '@prisma/client';

// ---- Services ----
import { findUserAssignments, findUserCompletions } from '@src/features/training/services';

// ---------------------------------------------------------------------------
// GET /training/my-assignments
// Description: Retrieve the current user's training assignments
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getMyAssignments: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/my-assignments - Request started',
    );

    // Authorize: minimum MEMBER role
    const user = await withRole(req, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'GET /training/my-assignments - User authorized');

    // Fetch user's assignments
    const page = parseInt(req.query.page as string) || undefined;
    const assignments = await findUserAssignments({
      userId: user.id,
      associationId: association.id,
      page,
    });

    logger.info({ traceId }, 'GET /training/my-assignments - Success');
    return success(res, { data: assignments.assignments, meta: assignments.pagination });
  }),
];

// ---------------------------------------------------------------------------
// GET /training/my-completions
// Description: Retrieve the current user's training completions
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getMyCompletions: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    // Resolve association
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/my-completions - Request started',
    );

    // Authorize: minimum MEMBER role
    const user = await withRole(req, UserRole.MEMBER);

    logger.info({ traceId, userId: user.id }, 'GET /training/my-completions - User authorized');

    // Fetch user's completions
    const page = parseInt(req.query.page as string) || undefined;
    const completions = await findUserCompletions({
      userId: user.id,
      associationId: association.id,
      page,
    });

    logger.info({ traceId }, 'GET /training/my-completions - Success');
    return success(res, { data: completions.module, meta: completions.pagination });
  }),
];
