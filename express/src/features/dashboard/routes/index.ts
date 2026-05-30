import { Router } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { success } from '@src/shared/utils/responses';
import { auth } from '@src/middleware/auth';
import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';

import { getDashboardOverview } from '@src/features/dashboard/services/dashboard.service';

// ---- Routes -----------------------------------------------------------------
// GET /api/dashboard/overview
// Description: Retrieve dashboard summary data for the user's association
// Security: Authenticated user

const router: Router = Router();

router.get('/overview', auth, async (req, res, next) => {
  try {
    // ----- Verify authenticated user
    const userId = req.user.id;

    if (!userId) throw new UnauthorizedError('Unauthorized');

    // ----- Resolve user's association
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { association: true },
    });

    if (!user || !user.associationId) throw new ForbiddenError('User association not found 2');

    // ----- Fetch dashboard data
    const association = {
      id: user.association.id,
      slug: user.association.slug,
      name: user.association.name,
    };
    const data = await getDashboardOverview(association.id);

    return success(res, { data });
  } catch (e) {
    next(e);
  }
});

export default router;
