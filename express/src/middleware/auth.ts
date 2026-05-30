import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@src/shared/lib/jwt';
import { UnauthorizedError } from '@src/shared/errors';
import { API_PUBLIC_ROUTES } from '@src/shared/constants';

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const path = req.path;
  const basePath = '/api' + path;

  if (API_PUBLIC_ROUTES.some((r) => basePath === r)) {
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

  req.userId = payload.sub;

  next();
}
