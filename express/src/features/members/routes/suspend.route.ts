import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findUniqueMember } from '@src/features/members/services/findUniqueMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';
import z from 'zod';

const SuspenseUserRouteParams = z.object({
  memberId: z.uuid(),
});

export const suspendMember: RequestHandler[] = [
  validate({ params: SuspenseUserRouteParams }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    const association = {
      id: user.association.id,
      slug: user.association.slug,
      name: user.association.name,
    };

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/members/[memberId]/suspend - Request started',
    );

    if (!user.role.includes(UserRole.PRESIDENT))
      throw new ForbiddenError('Insufficient permissions');

    logger.info(
      { traceId, userId: user.id },
      'POST /api/members/[memberId]/suspend - User authorized',
    );

    const params = req.params as z.infer<typeof SuspenseUserRouteParams>;

    const target = await findUniqueMember({ where: { id: params?.memberId } });

    if (!target) {
      throw new NotFoundError('Member not found');
    }

    if (target.associationId !== association.id) {
      throw new BadRequestError('Member does not belong to this association');
    }

    const updatedMember = await updateMember({
      where: { id: params?.memberId },
      data: { status: 'SUSPENDED' },
    });

    logger.info(
      { traceId, memberId: params?.memberId },
      'POST /api/members/[memberId]/suspend - Success',
    );

    return success(res, { data: updatedMember, message: 'Member suspended successfully' });
  },
];
