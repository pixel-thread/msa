import { Request, Response, NextFunction } from 'express';
import { generateCsrfToken, verifyCsrfToken } from '@src/shared/lib/csrf';
import { ForbiddenError } from '@src/shared/errors';
import { env } from '@src/env';

export function csrf(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const path = req.path;
  const authHeader = req.headers.authorization;
  const clientType = req.headers['x-client-type'];

  const isPublicPath = path.startsWith('/auth');
  if (isPublicPath || authHeader?.startsWith('Bearer ') || clientType === 'mobile') {
    return next();
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = generateCsrfToken();
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return next();
  }

  const csrfCookie = req.cookies?.['csrf-token'];
  const csrfHeader = req.headers['x-csrf-token'] as string | undefined;

  if (!csrfCookie || !csrfHeader || !verifyCsrfToken(csrfHeader, csrfCookie)) {
    return next(new ForbiddenError('Invalid or missing CSRF token'));
  }

  next();
}
