import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { getDashboardOverview } from '@src/features/dashboard/services/dashboard.service';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';

const router = Router();

router.get('/overview', auth, async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });

    if (!user || !user.associationId) throw new ForbiddenError('User association not found');

    const association = { id: user.association.id, slug: user.association.slug, name: user.association.name };
    const data = await getDashboardOverview(association.id);
    return success(res, { data });
  } catch (e) { next(e); }
});

export default router;
