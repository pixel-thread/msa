import { Request, Response, NextFunction, type RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { formatZodIssues } from '@src/shared/validators/format-zod-issues';

interface ValidationSchemas<TBody, TQuery, TParams> {
  body?: ZodType<TBody>;
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
}

function defineProp<T extends Record<string, unknown>>(obj: Record<string, unknown>, key: string, value: T[keyof T & string]): void {
  Object.defineProperty(obj, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validate<
  TBody = never,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>,
): RequestHandler {
  return (req: Request<TParams, any, TBody, TQuery>, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError(
            result.error.issues[0]?.message || 'Validation failed',
            formatZodIssues(result.error.issues),
          );
        }
        defineProp(req, 'body', result.data);
      }

      if (schemas.query) {
        const parsed = req.query;
        const result = schemas.query.safeParse(parsed);
        if (!result.success) {
          throw new ValidationError(
            result.error.issues[0]?.message || 'Validation failed',
            formatZodIssues(result.error.issues),
          );
        }
        defineProp(req, 'query', result.data);
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          throw new ValidationError(
            result.error.issues[0]?.message || 'Validation failed',
            formatZodIssues(result.error.issues),
          );
        }
        defineProp(req, 'params', result.data as Record<string, string>);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
