import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function traceId(req: Request, res: Response, next: NextFunction) {
  const id = (req.traceId as string) || crypto.randomUUID();
  req.traceId = id;
  res.setHeader('x-trace-id', id);
  next();
}
