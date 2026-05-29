import type { NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';

import { RouteContext } from '@src/shared/api/with-validation';
import { AssociationDetails, WithAssociationOptions } from '@src/shared/api/with-association';
import { handleApiErrors } from '@src/shared/api/handle-api-errors';
import { prisma } from '@src/shared/lib/prisma';
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '@src/shared/errors';
import { formatZodIssues } from '@validator/format-zod-issues';
import { createTracingContext } from './tracing-context';

/**
 * Zod preprocessor that parses a JSON string into the given schema.
 * Use this for FormData fields that contain stringified JSON objects/arrays.
 *
 * @example
 * const MyFormSchema = z.object({
 *   metadata: zjson(z.object({ title: z.string() })),
 *   file: z.instanceof(File),
 * });
 */
export function zjson<T extends ZodType>(schema: T): ZodType<z.infer<T>> {
  return z.preprocess((val) => {
    if (typeof val !== 'string') return val;
    try {
      return JSON.parse(val) as unknown;
    } catch {
      return val;
    }
  }, schema) as ZodType<z.infer<T>>;
}

/**
 * Parses request.formData() into a plain object and validates it against the schema.
 * File values are kept as File instances; all other entries remain as strings.
 * Multi-value keys (e.g. multiple files) are collected into arrays.
 */
const parseFormData = async <TFormData>(
  request: NextRequest,
  schema: ZodType<TFormData>,
): Promise<TFormData> => {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    throw new BadRequestError('Invalid or missing form data');
  }

  // Convert FormData to a plain object, preserving File instances
  const raw: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    const existing = raw[key];

    if (existing !== undefined) {
      // Accumulate multiple values into an array
      raw[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

/**
 * Parses query parameters from the request URL and validates against the schema.
 */
const parseQuery = <TQuery>(request: NextRequest, schema: ZodType<TQuery>): TQuery => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

/**
 * Parses route params from the context and validates against the schema.
 */
const parseParams = async <
  TParams extends Record<string, string>,
  TContext extends RouteContext<TParams>,
>(
  context: TContext,
  schema: ZodType<TParams>,
): Promise<TParams> => {
  const params = (await context.params) ?? ({} as TParams);
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message, formatZodIssues(result.error.issues));
  }

  return result.data;
};

/**
 * Wraps a route handler with FormData parsing + Zod validation + error handling.
 * Works like `withValidation` but reads `request.formData()` instead of `request.json()`.
 */
export function withFormDataValidation<
  TFormData extends Record<string, unknown> = Record<string, unknown>,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
  TContext extends RouteContext<TParams> = RouteContext<TParams>,
>(
  schemas: {
    formData: ZodType<TFormData>;
    query?: ZodType<TQuery>;
    params?: ZodType<TParams>;
  },
  handler: (
    request: NextRequest,
    context: TContext,
    validated: {
      formData: TFormData;
      query?: TQuery;
      params?: TParams;
      traceId: string;
    },
  ) => Promise<Response>,
) {
  return handleApiErrors<TContext>(async (request, context) => {
    const { traceId } = createTracingContext(request);
    const validated: {
      formData?: TFormData;
      query?: TQuery;
      params?: TParams;
      traceId: string;
    } = { traceId };

    validated.formData = await parseFormData(request, schemas.formData);

    if (schemas.query) {
      validated.query = parseQuery(request, schemas.query);
    }

    if (schemas.params) {
      validated.params = await parseParams(context, schemas.params);
    }

    return handler(
      request,
      context,
      validated as {
        formData: TFormData;
        query?: TQuery;
        params?: TParams;
        traceId: string;
      },
    );
  });
}

/**
 * Wraps `withFormDataValidation` to inject association context — the FormData
 * equivalent of `withAssociation`.
 */
export function withAssociationFormData<
  TFormData extends Record<string, unknown> = Record<string, unknown>,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
>(
  schemas: {
    formData: ZodType<TFormData>;
    query?: ZodType<TQuery>;
    params?: ZodType<TParams>;
  },
  handler: (
    association: AssociationDetails,
    validated: {
      formData: TFormData;
      query?: TQuery;
      params?: TParams;
      traceId: string;
    },
    request: NextRequest,
    context: RouteContext<TParams>,
  ) => Promise<Response>,
  options?: WithAssociationOptions,
) {
  return withFormDataValidation<TFormData, TQuery, TParams>(
    schemas,
    async (request, context, validated) => {
      const userId = request.headers.get('x-user-id');

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { association: true },
      });

      if (!user || !user.associationId) {
        throw new ForbiddenError('User association not found');
      }

      if (options?.slugParam) {
        const params = (await context.params) as TParams;
        const urlSlug = params[options.slugParam];

        if (urlSlug && user.association.slug !== urlSlug) {
          throw new ForbiddenError('Access denied: Invalid association');
        }
      }

      const association: AssociationDetails = {
        id: user.association.id,
        slug: user.association.slug,
        name: user.association.name,
      };

      return handler(association, validated, request, context);
    },
  );
}
