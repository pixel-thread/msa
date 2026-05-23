import { UserRole } from "@prisma/client";
import { getUserInvoices } from "@src/features/user/services";
import { withAssociation, withRole } from "@src/shared/api";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation({}, async (association, _, req) => {
  await withRole(req, UserRole.MEMBER);

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("Unauthorized");

  const invoices = await getUserInvoices({
    where: {
      associationId: association.id,
      userId: userId,
    },
  });

  return SuccessResponse({
    data: invoices,
    message: "Invoices fetched successfully",
  });
});
