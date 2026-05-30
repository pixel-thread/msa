import { Request, Response, NextFunction, type RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { formatZodIssues } from '@src/shared/validators/format-zod-issues';

/** Zod validation schemas for an Express request (body, query, params). */
interface ValidationSchemas<TBody, TQuery, TParams> {
  body?: ZodType<TBody>;
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
}

/** Defines a non-configurable, enumerable property on an object. */
function defineProp(
  obj: any,
  key: string,
  value: any,
): void {
  Object.defineProperty(obj, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

/** Express middleware that validates req.body / req.query / req.params against Zod schemas. */
export function validate<
  TBody = any,
  TQuery = any,
  TParams = any,
>(schemas: ValidationSchemas<TBody, TQuery, TParams>): RequestHandler<any, any, any, any> {
  return (req: Request, _res: Response, next: NextFunction) => {
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
