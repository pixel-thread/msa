import { Response } from 'express';

interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export function success<T>(
  res: Response,
  {
    data,
    meta,
    message,
  }: {
    data: T;
    meta?: ResponseMeta;
    message?: string;
  },
  status: 200 | 201 | 204 = 200,
) {
  return res.status(status).json({
    success: true,
    data,
    meta,
    message,
    timestamp: new Date().toISOString(),
  });
}

export function error(
  res: Response,
  {
    message,
    error: detail,
  }: {
    message: string;
    error?: string | Record<string, unknown>;
  },
  status = 400,
) {
  return res.status(status).json({
    success: false,
    message,
    error: detail || undefined,
    timestamp: new Date().toISOString(),
  });
}
