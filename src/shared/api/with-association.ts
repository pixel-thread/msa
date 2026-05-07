import { headers } from "next/headers";
import { ForbiddenError } from "@src/shared/errors";
import { withValidation, RouteContext } from "./with-validation";
import { prisma } from "../lib/prisma";

export interface AssociationDetails {
  id: string;
  slug: string;
  name: string;
}

/**
 * Wraps withValidation to inject association context as the first argument.
 */
export function withAssociation<
  TBody = never,
  TQuery = never,
  TParams extends Record<string, string> = Record<string, string>,
>(
  schemas: Parameters<typeof withValidation<TBody, TQuery, TParams>>[0],
  handler: (
    association: AssociationDetails,
    validated: { body?: TBody; query?: TQuery; params?: TParams },
    request: Request,
    context: RouteContext<TParams>,
  ) => Promise<Response>,
) {
  // We utilize your existing withValidation logic for the heavy lifting
  return withValidation<TBody, TQuery, TParams>(
    schemas,
    async (request, context, validated) => {
      const userId = request.headers.get("x-user-id");
      if (!userId) {
        throw new ForbiddenError("Unauthorized");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { association: true },
      });

      // middleware.ts should populate these headers for every authenticated request
      const associationId = user?.associationId || user?.association.id;
      const associationSlug = user?.association.slug;
      const associationName = user?.association.name;

      // Security Gate: Ensure the middleware did its job
      if (!associationId) {
        throw new ForbiddenError("Missing Association Context");
      }

      const association: AssociationDetails = {
        id: associationId,
        slug: associationSlug ?? "unknown",
        name: associationName ?? "Association",
      };

      // Execute your handler with the association details first
      return handler(association, validated, request, context);
    },
  );
}
