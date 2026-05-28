import { UserRole } from "@prisma/client";
import { getUserInvoice } from "@src/features/user/services";
import { withAssociation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";
import { logger } from "@src/shared/logger";

const InvoiceRouteParams = z.object({
  invoiceId: z.uuid(),
});

export const GET = withAssociation(
  { params: InvoiceRouteParams },
  async (association, { params, traceId }, req) => {
    logger.info("GET /api/user/invoices/[invoiceId] - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(req, UserRole.MEMBER);

    logger.info("GET /api/user/invoices/[invoiceId] - User authorized", {
      traceId,
      userId: user.id,
    });

    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const invoices = await getUserInvoice({
      where: {
        associationId: association.id,
        userId: userId,
        id: params?.invoiceId,
      },
    });

    logger.info("GET /api/user/invoices/[invoiceId] - Success", {
      traceId,
      invoiceId: params?.invoiceId,
    });

    return SuccessResponse({
      data: invoices,
      message: "Invoices fetched successfully",
    });
  },
);
