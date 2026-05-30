import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { submitDsarTicket } from '@src/features/dsar/services';
import { SubmitDsarSchema } from '@src/features/dsar/validators';
import { logger } from '@src/shared/logger';

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

/** POST /api/dsar/submit - Submit a new DSAR ticket. */
export const submitDsar: RequestHandler[] = [
  validate({ body: SubmitDsarSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/dsar/submit - Request started',
    );

    const userId = req.userId as string;

    const ticket = await submitDsarTicket({
      associationId: association.id,
      userId,
      data: req.body,
    });

    logger.info({ traceId, userId, ticketId: ticket.id }, 'POST /api/dsar/submit - Success');
    return success(res, { data: ticket }, 201);
  },
];
