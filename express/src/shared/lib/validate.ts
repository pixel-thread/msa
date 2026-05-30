import { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '@src/shared/errors';
import { formatZodIssues } from '@src/shared/validators/format-zod-issues';

interface ValidationSchemas<TBody, TQuery, TParams> {
  body?: ZodType<TBody>;
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
}

export function validate<
  TBody = never,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>,
) {
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
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          throw new ValidationError(
            result.error.issues[0]?.message || 'Validation failed',
            formatZodIssues(result.error.issues),
          );
        }
        req.query = result.data as TQuery;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          throw new ValidationError(
            result.error.issues[0]?.message || 'Validation failed',
            formatZodIssues(result.error.issues),
          );
        }
        req.params = result.data as TParams;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
