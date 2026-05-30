import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import { ConsentService } from '@src/features/consent/services/consent.service';
import {
  ConsentReceiptParamsSchema,
  UpdateConsentReceiptSchema,
} from '@src/features/consent/validators/consent.validators';
import { pageNumberValidation } from '@src/shared/validators';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { z } from 'zod';
import { logger } from '@src/shared/logger';

const UserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const UserQuerySchema = z.object({
  page: pageNumberValidation,
});

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 2,
  FINANCE: 3,
  DPO: 4,
  MEMBER: 5,
};

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

async function withRole(req: Request, role: UserRole) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await getUniqueUser({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('Unauthorized');
  const roles = user.role as UserRole[];
  const highestUserRole = roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] < ROLE_HIERARCHY[highest] ? current : highest,
  );
  const hasPermission = ROLE_HIERARCHY[highestUserRole] <= ROLE_HIERARCHY[role];
  if (!hasPermission) throw new ForbiddenError('Permission denied');
  return { ...user, role: roles };
}

export const getReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'GET /api/consent/[receiptId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    const receipt = await ConsentService.findUniqueConsentReceipt(association.id, receiptId);
    if (!receipt) throw new NotFoundError('Consent receipt not found');

    logger.info({ traceId }, 'GET /api/consent/[receiptId] - Success');
    return success(res, { data: receipt });
  },
];

export const updateReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema, body: UpdateConsentReceiptSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'PATCH /api/consent/[receiptId] - Request started',
    );

    if (!req.body) throw new BadRequestError('Request body is required');

    await withRole(req, UserRole.DPO);

    const receipt = await ConsentService.updateConsentReceipt(
      association.id,
      receiptId,
      req.userId as string,
      req.body,
    );

    logger.info({ traceId }, 'PATCH /api/consent/[receiptId] - Success');
    return success(res, { data: receipt, message: 'Consent receipt updated successfully' });
  },
];

export const deleteReceipt: RequestHandler[] = [
  validate({ params: ConsentReceiptParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const receiptId = req.params.receiptId as string;

    logger.info(
      { traceId, associationId: association.id, receiptId },
      'DELETE /api/consent/[receiptId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    await ConsentService.deleteConsentReceipt(
      association.id,
      receiptId,
      req.userId as string,
    );

    logger.info({ traceId }, 'DELETE /api/consent/[receiptId] - Success');
    return success(res, { data: null, message: 'Consent receipt deleted successfully' });
  },
];

export const getUserConsents: RequestHandler[] = [
  validate({ params: UserParamsSchema, query: UserQuerySchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const targetUserId = req.params.userId as string;

    logger.info(
      { traceId, associationId: association.id, targetUserId },
      'GET /api/consent/users/[userId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    const page = (req.query as any).page || 1;
    const data = await ConsentService.getUserConsentHistoryById(targetUserId, association.id, page);

    if (data.records.length === 0) {
      throw new NotFoundError('No consent records found for this user');
    }

    logger.info(
      { traceId, count: data.records.length },
      'GET /api/consent/users/[userId] - Success',
    );
    return success(res, { data: data.records, meta: data.pagination });
  },
];
