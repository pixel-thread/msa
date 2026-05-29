import { ForbiddenError, UnauthorizedError } from '@src/shared/errors';
import { withValidation, RouteContext } from '@src/shared/api/with-validation';
import { prisma } from '@src/shared/lib/prisma';
import type { NextRequest } from 'next/server';

export interface AssociationDetails {
  id: string;
  slug: string;
  name: string;
}

export interface WithAssociationOptions {
  slugParam?: string;
}

/**
 * Wraps withValidation to inject association context as the first argument.
 * Validates that the user's association matches the URL slug if provided.
 */
export function withAssociation<
  TBody = never,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
>(
  schemas: Parameters<typeof withValidation<TBody, TQuery, TParams>>[0],
  handler: (
    association: AssociationDetails,
    validated: {
      body?: TBody;
      query?: TQuery;
      params?: TParams;
      traceId: string;
    },
    request: NextRequest,
    context: RouteContext<TParams>,
  ) => Promise<Response>,
  options?: WithAssociationOptions,
) {
  return withValidation<TBody, TQuery, TParams>(schemas, async (request, context, validated) => {
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
  });
}
