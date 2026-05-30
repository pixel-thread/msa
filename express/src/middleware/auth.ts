import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@src/shared/lib/jwt';
import { UnauthorizedError } from '@src/shared/errors';
import { API_PUBLIC_ROUTES } from '@src/shared/constants';
import { prisma } from '@src/shared/lib';

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const path = req.path;

  if (API_PUBLIC_ROUTES.some((r) => path === r)) {
    return next();
  }

  const token =
    req.cookies?.access_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : undefined);

  if (!token) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return next(new UnauthorizedError('Invalid token'));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) throw new UnauthorizedError('Invalid token');

  req.userId = payload.sub;

  req.user = {
    id: user.id,
    role: user.role,
    associationId: user.associationId,
    memberTypeId: user.memberTypeId,
  };

  next();
}
