import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { getUniqueUser } from '@src/shared/services/user/get-unique-user';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  PRESIDENT: 1,
  SECRETARY: 2,
  FINANCE: 3,
  DPO: 4,
  MEMBER: 5,
};

export async function withRole(req: NextRequest, role: UserRole) {
  const userId = req.headers.get('x-user-id');

  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await getUniqueUser({ where: { id: userId } });

  if (!user) throw new UnauthorizedError('Unauthorized');

  const highestUserRole = user.role.reduce((highest, current) => {
    return ROLE_HIERARCHY[current] < ROLE_HIERARCHY[highest] ? current : highest;
  });

  const hasPermission = ROLE_HIERARCHY[highestUserRole] <= ROLE_HIERARCHY[role];

  if (!hasPermission) throw new ForbiddenError('Permission denied');

  return user;
}
