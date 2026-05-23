import { UserRole } from "@prisma/client";
import { getUserInvoice } from "@src/features/user/services";
import { withAssociation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const InvoiceRouteParams = z.object({
  invoiceId: z.uuid(),
});

export const GET = withAssociation(
  { params: InvoiceRouteParams },
  async (association, { params }, req) => {
    await withRole(req, UserRole.MEMBER);

    const userId = req.headers.get("x-user-id");

    if (!userId) throw new UnauthorizedError("Unauthorized");

    const invoices = await getUserInvoice({
      where: {
        associationId: association.id,
        userId: userId,
        id: params?.invoiceId,
      },
    });

    return SuccessResponse({
      data: invoices,
      message: "Invoices fetched successfully",
    });
  },
);
