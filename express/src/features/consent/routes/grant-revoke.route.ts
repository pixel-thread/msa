import { Request, NextFunction, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { ConsentStatus } from '@prisma/client';
import { ConsentService } from '@src/features/consent/services/consent.service';
import { ConsentUpdateSchema } from '@src/features/consent/validators/consent.validators';
import { logger } from '@src/shared/logger';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const grantConsent = [
  validate({ body: ConsentUpdateSchema.omit({ action: true }) }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /api/consent/grant - Request started');

    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    if (!req.body) throw new BadRequestError('Request body is required');

    const ipAddress = (req.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    const receipts = await ConsentService.updateConsent(
      userId, association.id,
      { ...req.body, action: ConsentStatus.GRANTED },
      ipAddress, userAgent,
    );

    logger.info({ traceId, userId }, 'POST /api/consent/grant - Consent granted successfully');
    return success(res, { message: 'Consent granted successfully', data: receipts });
  },
];

export const revokeConsent = [
  validate({ body: ConsentUpdateSchema.omit({ action: true }) }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const association = await getAssociation(req);
    logger.info({ traceId, associationId: association.id }, 'POST /api/consent/revoke - Request started');

    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    if (!req.body) throw new BadRequestError('Request body is required');

    const ipAddress = (req.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    const receipts = await ConsentService.updateConsent(
      userId, association.id,
      { ...req.body, action: ConsentStatus.WITHDRAWN },
      ipAddress, userAgent,
    );

    logger.info({ traceId, userId }, 'POST /api/consent/revoke - Consent revoked successfully');
    return success(res, { message: 'Consent revoked successfully', data: receipts });
  },
];
