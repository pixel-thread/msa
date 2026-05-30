import { Request, Response } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@src/shared/errors';
import { UserRole, UserStatus } from '@prisma/client';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { logger } from '@src/shared/logger';
import z from 'zod';

const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

const UpdateUserStatusParamsSchema = z.object({
  memberId: z.uuid(),
});

export const updateStatus = [
  validate({ body: UpdateUserStatusSchema, params: UpdateUserStatusParamsSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });
    if (!user || !user.associationId) throw new ForbiddenError('User association not found');
    const association = { id: user.association.id, slug: user.association.slug, name: user.association.name };

    logger.info({ traceId, associationId: association.id }, 'PATCH /api/members/[memberId]/status - Request started');

    if (!user.role.includes(UserRole.PRESIDENT)) throw new ForbiddenError('Insufficient permissions');

    logger.info({ traceId, userId: user.id }, 'PATCH /api/members/[memberId]/status - User authorized');

    const params = req.params as z.infer<typeof UpdateUserStatusParamsSchema>;
    const memberId = params.memberId;

    if (!memberId) throw new UnauthorizedError('Unauthorized');

    const target = await findFirstMember({
      where: { id: memberId, associationId: association.id },
    });

    if (!target) throw new NotFoundError('User does not exist in the association');

    const body = req.body as z.infer<typeof UpdateUserStatusSchema>;
    const updatedUser = await updateMember({
      where: { id: memberId },
      data: { status: body?.status },
    });

    logger.info({ traceId, memberId, status: body?.status }, 'PATCH /api/members/[memberId]/status - Success');

    return success(res, { data: updatedUser, message: 'User status updated successfully' });
  },
];
