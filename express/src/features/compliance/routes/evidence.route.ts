import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { success } from '@src/shared/utils/responses';
import { UserRole } from '@prisma/client';
import { generateComplianceEvidence } from '@src/features/compliance/services';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** GET handler to generate and retrieve compliance evidence for a given number of days. */
export const getEvidence: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    logger.info(
      { traceId, associationId: association.id },
      'GET /compliance/evidence - Request started',
    );
    const user = await withRole(req, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /compliance/evidence - User authorized',
    );

    const days = parseInt(req.query.days as string, 10) || 30;
    const evidence = await generateComplianceEvidence(association.id, days);

    logger.info({ traceId, associationId: association.id }, 'GET /compliance/evidence - Success');
    return success(res, { data: evidence });
  }),
];
