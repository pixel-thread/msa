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
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import z from 'zod';

/** Schema for validating the route parameter containing the member ID. */
const ParamSchema = z.object({ memberId: z.uuid() });

/** Route handler for soft-deleting a member. Requires SECRETARY role. */
export const deleteMember: RequestHandler[] = [
  validate({ params: ParamSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const userId = req.userId as string;
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
      'DELETE /api/members/[memberId] - Request started',
    );

    await withRole(req, UserRole.SECRETARY);

    const params = req.params as z.infer<typeof ParamSchema>;

    const target = await findUniqueMember({ where: { id: params.memberId } });
    if (!target) throw new NotFoundError('Member not found');
    if (target.associationId !== association.id) {
      throw new BadRequestError('Member does not belong to this association');
    }

    await prisma.user.update({
      where: { id: params.memberId },
      data: { deletedAt: new Date() },
    });

    logger.info({ traceId, memberId: params.memberId }, 'DELETE /api/members/[memberId] - Success');

    return success(res, { data: null, message: 'Member deleted successfully' });
  },
];
