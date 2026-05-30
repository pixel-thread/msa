import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@src/shared/lib/jwt';
import { UnauthorizedError } from '@src/shared/errors';

const PUBLIC_API_ROUTES = [
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/docs',
  '/api/logs',
  '/api/payments/webhook',
  '/api/cron',
];

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password'];

export function auth(req: Request, _res: Response, next: NextFunction) {
  const path = req.path;
  const basePath = '/api' + path;

  if (PUBLIC_API_ROUTES.some((r) => basePath.startsWith(r))) {
    return next();
  }
  if (PUBLIC_PATHS.some((p) => path === p)) {
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

  verifyAccessToken(token)
    .then((payload) => {
      req.headers['x-user-id'] = payload.sub;
      next();
    })
    .catch(next);
}
