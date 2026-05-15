import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

export const GET = withAssociation({}, async (association, _, request) => {
  await withRole(request, UserRole.FINANCE);

  const accounts = await prisma.account.findMany({
    where: { associationId: association.id },
  });

  return SuccessResponse({ data: { accounts, summary: "Ledger summary placeholder" } });
});
