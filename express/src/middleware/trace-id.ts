import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function traceId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
  req.headers['x-trace-id'] = id;
  res.setHeader('x-trace-id', id);
  next();
}
