import { UserRole } from "@prisma/client";
import {
  getActiveProvider,
  getProvidersByAssociation,
} from "@src/features/payments/services/payment-provider.service";
import { withAssociation, withRole } from "@src/shared/api";
import { logger } from "@src/shared/logger";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation({}, async (association, { traceId }, req) => {
  logger.info("GET /api/payments/providers/status - Request started", { traceId });

  const user = await withRole(req, UserRole.MEMBER);
  logger.info("GET /api/payments/providers/status - User authorized", { traceId, userId: user.id });

  const providerByAssociation = await getProvidersByAssociation(association.id);

  if (!providerByAssociation) {
    throw new NotFoundError("No Provider setup");
  }

  const activeProvider = await getActiveProvider(association.id);

  if (!activeProvider) {
    throw new NotFoundError("Provider not found");
  }

  logger.info("GET /api/payments/providers/status - Success", { traceId, isActive: activeProvider.isActive });

  return SuccessResponse({
    data: { status: activeProvider.isActive },
  });
});
