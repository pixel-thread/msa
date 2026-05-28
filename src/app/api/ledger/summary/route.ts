import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { logger } from "@src/shared/logger";

export const GET = withAssociation({}, async (association, { traceId }, request) => {
  logger.info("GET /api/ledger/summary - Request started", {
    traceId,
    associationId: association.id,
  });

  const user = await withRole(request, UserRole.FINANCE);

  logger.info("GET /api/ledger/summary - User authorized", {
    traceId,
    userId: user.id,
  });

  const accounts = await prisma.account.findMany({
    where: { associationId: association.id },
  });

  logger.info("GET /api/ledger/summary - Success", {
    traceId,
    count: accounts.length,
  });

  return SuccessResponse({ data: { accounts, summary: "Ledger summary placeholder" } });
});
