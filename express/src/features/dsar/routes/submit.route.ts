// ---- DSAR - Submit Ticket

// ---- Imports

// ---- External Libraries

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

// ---- Shared Utilities

import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- DSAR Services

import { submitDsarTicket } from '@src/features/dsar/services';

// ---- DSAR Validators

import { SubmitDsarSchema } from '@src/features/dsar/validators';

// ---- Helpers

/**
 * Resolve the association context from the authenticated user's request.
 * Business logic: Every DSAR ticket is scoped to the user's association.
 */
async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

// ---- Handlers

// ============================================================================
// POST /api/dsar/submit
// Description: Submit a new DSAR ticket
// Security: Any authenticated user
// ============================================================================

export const submitDsar: RequestHandler[] = [
  validate({ body: SubmitDsarSchema }),

  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // ---- Auth: Resolve association

    const association = await getAssociation(req);

    // ---- Auth log

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/dsar/submit - Request started',
    );

    // ---- Business logic: Create DSAR ticket

    const userId = req.userId as string;

    const ticket = await submitDsarTicket({
      associationId: association.id,
      userId,
      data: req.body,
    });

    // ---- Result log

    logger.info({ traceId, userId, ticketId: ticket.id }, 'POST /api/dsar/submit - Success');

    return success(res, { data: ticket }, 201);
  }),
];
