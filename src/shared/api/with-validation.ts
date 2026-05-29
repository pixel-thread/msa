import type { NextRequest } from 'next/server';
import type { ZodType } from 'zod';

import { InvalidJsonError, ValidationError } from '@src/shared/errors';
import { formatZodIssues } from '@validator/format-zod-issues';
import { handleApiErrors } from './handle-api-errors';
import { createTracingContext } from './tracing-context';

type MaybePromise<T> = Promise<T> | T;

export interface RouteContext<TParams extends Record<string, string> = Record<string, string>> {
  params?: MaybePromise<TParams>;
}

interface ValidationSchemas<TBody, TQuery, TParams> {
  body?: ZodType<TBody>;
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
}

interface ValidatedValues<TBody, TQuery, TParams> {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
  traceId: string;
}

type ValidatedHandler<
  TBody,
  TQuery,
  TParams extends Record<string, string>,
  TContext extends RouteContext<TParams>,
> = (
  request: NextRequest,
  context: TContext,
  validated: ValidatedValues<TBody, TQuery, TParams>,
) => Promise<Response>;

const parseNextRequestBody = async <TBody>(request: NextRequest, schema: ZodType<TBody>) => {
  let payload: unknown;

  try {
    payload = (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

const parseNextRequestQuery = <TQuery>(request: NextRequest, schema: ZodType<TQuery>) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

const parseRouteParams = async <
  TParams extends Record<string, string>,
  TContext extends RouteContext<TParams>,
>(
  context: TContext,
  schema: ZodType<TParams>,
) => {
  const params = (await context.params) ?? ({} as TParams);
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

export function withValidation<
  TBody = never,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
  TContext extends RouteContext<TParams> = RouteContext<TParams>,
>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>,
  handler: ValidatedHandler<TBody, TQuery, TParams, TContext>,
) {
  return handleApiErrors<TContext>(async (request, context) => {
    const { traceId } = createTracingContext(request);
    const validated: ValidatedValues<TBody, TQuery, TParams> = { traceId };

    if (schemas.body) {
      validated.body = await parseNextRequestBody(request, schemas.body);
    }

    if (schemas.query) {
      validated.query = parseNextRequestQuery(request, schemas.query);
    }

    if (schemas.params) {
      validated.params = await parseRouteParams(context, schemas.params);
    }

    return handler(request, context, validated);
  });
}
