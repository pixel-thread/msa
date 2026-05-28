import { UserRole } from "@prisma/client";
import { getUserInvoices } from "@src/features/user/services";
import { withAssociation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { buildPagination, SuccessResponse } from "@src/shared/utils";
import { pageNumberValidation } from "@src/shared/validators";
import z from "zod";
import { logger } from "@src/shared/logger";

const InvoiceRouteQuery = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: InvoiceRouteQuery },
  async (association, { query, traceId }, req) => {
    logger.info("GET /api/user/invoices - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.MEMBER);

    logger.info("GET /api/user/invoices - User authorized", {
      traceId,
      userId: user.id,
    });

    const page = query?.page || 1;
    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const [invoices, total] = await getUserInvoices({
      where: {
        associationId: association.id,
        userId: userId,
      },
      page,
    });

    logger.info("GET /api/user/invoices - Success", {
      traceId,
      count: invoices.length,
    });

    return SuccessResponse({
      data: invoices,
      message: "Invoices fetched successfully",
      meta: buildPagination(total, page),
    });
  },
);
