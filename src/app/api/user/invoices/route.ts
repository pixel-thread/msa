import { UserRole } from "@prisma/client";
import { getUserInvoices } from "@src/features/user/services";
import { withAssociation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { buildPagination, SuccessResponse } from "@src/shared/utils";
import { pageNumberValidation } from "@src/shared/validators";
import z from "zod";

const InvoiceRouteQuery = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: InvoiceRouteQuery },
  async (association, { query }, req) => {
    await withRole(req, UserRole.MEMBER);
    const page = query?.page || 1;
    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const [invoices, total] = await getUserInvoices({
      where: {
        associationId: association.id,
        userId: userId,
      },
    });

    return SuccessResponse({
      data: invoices,
      message: "Invoices fetched successfully",
      meta: buildPagination(total, page),
    });
  },
);
