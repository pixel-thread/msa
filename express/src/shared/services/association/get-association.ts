import { Request } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';

/** Resolves the current user's association from the request context. */
export async function getAssociation(req: Request) {
  const userId = req.userId as string;

  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}
