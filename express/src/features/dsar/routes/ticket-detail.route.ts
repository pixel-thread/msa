import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole, DsarStatus } from '@prisma/client';
import { z } from 'zod';
import {
  findUniqueDsarTicket,
  deleteDsarTicket,
  respondToDsarTicket,
  assignDsarTicket,
} from '@src/features/dsar/services';
import { RespondDsarSchema } from '@src/features/dsar/validators';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';
import { hasHighRoleAccess } from '@src/shared/utils/has-high-role';
import { logger } from '@src/shared/logger';
import { asyncHandler } from '@src/shared/utils/async-handler';

/** Schema for ticket ID path parameter. */
const ParamsSchema = z.object({ ticketId: z.string().uuid() });

/** Schema for assigning a ticket to a user. */
const AssignSchema = z.object({ assignedToId: z.string().uuid() });

/** Schema for rejecting a ticket with a reason. */
const RejectSchema = z.object({ reason: z.string().min(1).max(500) });

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

/** GET /api/dsar/:ticketId - Retrieve a single DSAR ticket (owner or DPO role required). */
export const getTicket: RequestHandler[] = [
  validate({ params: ParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const userId = req.userId as string;
    const ticketId = req.params.ticketId as string;

    logger.info(
      { traceId, associationId: association.id, ticketId },
      'GET /api/dsar/[ticketId] - Request started',
    );

    const ticket = await findUniqueDsarTicket(ticketId, association.id);
    if (!ticket) throw new NotFoundError('DSAR ticket not found');

    const isOwner = ticket.userId === userId;
    if (!isOwner) {
      await withRole(req, UserRole.DPO);
    }

    logger.info({ traceId }, 'GET /api/dsar/[ticketId] - Success');
    return success(res, { data: ticket });
  }),
];

/** DELETE /api/dsar/:ticketId - Delete a DSAR ticket (DPO role required). */
export const deleteTicket: RequestHandler[] = [
  validate({ params: ParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const actorId = req.userId as string;
    const ticketId = req.params.ticketId as string;

    logger.info(
      { traceId, associationId: association.id, ticketId },
      'DELETE /api/dsar/[ticketId] - Request started',
    );

    await withRole(req, UserRole.DPO);

    const ticket = await findUniqueDsarTicket(ticketId, association.id);
    if (!ticket) throw new NotFoundError('DSAR ticket not found');

    await deleteDsarTicket({ associationId: association.id, ticketId, actorId });

    logger.info({ traceId }, 'DELETE /api/dsar/[ticketId] - Success');
    return success(res, { data: null, message: 'DSAR ticket deleted successfully' });
  }),
];

/** POST /api/dsar/:ticketId/respond - Respond to a DSAR ticket (DPO role required). */
export const respondToTicket: RequestHandler[] = [
  validate({ params: ParamsSchema, body: RespondDsarSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const ticketId = req.params.ticketId as string;

    logger.info(
      { traceId, associationId: association.id, ticketId },
      'POST /api/dsar/[ticketId]/respond - Request started',
    );

    const actorId = req.userId as string;
    await withRole(req, UserRole.DPO);

    const ticket = await respondToDsarTicket({
      associationId: association.id,
      ticketId,
      actorId,
      data: req.body,
    });

    logger.info({ traceId }, 'POST /api/dsar/[ticketId]/respond - Success');
    return success(res, { data: ticket });
  }),
];

/** PATCH /api/dsar/:ticketId/assign - Assign a DSAR ticket to an admin user (DPO role required). */
export const assignTicket: RequestHandler[] = [
  validate({ params: ParamsSchema, body: AssignSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const ticketId = req.params.ticketId as string;

    logger.info(
      { traceId, associationId: association.id, ticketId },
      'PATCH /api/dsar/[ticketId]/assign - Request started',
    );

    const actorId = req.userId as string;
    await withRole(req, UserRole.DPO);

    const user = await getUniqueUser({ where: { id: req.body.assignedToId } });
    if (!user) throw new NotFoundError('User not found');
    if (!hasHighRoleAccess(user.role as UserRole[]))
      throw new BadRequestError('User does not have the required role');

    const ticket = await assignDsarTicket({
      associationId: association.id,
      ticketId,
      actorId,
      assignedToId: req.body.assignedToId,
    });

    logger.info({ traceId }, 'PATCH /api/dsar/[ticketId]/assign - Success');
    return success(res, { data: ticket });
  }),
];

/** POST /api/dsar/:ticketId/reject - Reject a DSAR ticket with a reason (DPO role required). */
export const rejectTicket: RequestHandler[] = [
  validate({ params: ParamsSchema, body: RejectSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const ticketId = req.params.ticketId as string;

    logger.info(
      { traceId, associationId: association.id, ticketId },
      'POST /api/dsar/[ticketId]/reject - Request started',
    );

    const actorId = req.userId as string;
    await withRole(req, UserRole.DPO);

    const ticket = await respondToDsarTicket({
      associationId: association.id,
      ticketId,
      actorId,
      data: { status: DsarStatus.REJECTED, rejectedReason: req.body.reason },
    });

    logger.info({ traceId }, 'POST /api/dsar/[ticketId]/reject - Success');
    return success(res, { data: ticket });
  }),
];
