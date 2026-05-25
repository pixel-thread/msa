import { UserRole } from "@prisma/client";
import {
  getActiveProvider,
  getProvidersByAssociation,
} from "@src/features/payments/services/payment-provider.service";
import { withAssociation, withRole } from "@src/shared/api";
import { NotFoundError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation({}, async (association, _, req) => {
  await withRole(req, UserRole.MEMBER);

  const providerByAssociation = await getProvidersByAssociation(association.id);

  if (!providerByAssociation) {
    throw new NotFoundError("No Provider setup");
  }

  const activeProvider = await getActiveProvider(association.id);

  if (!activeProvider) {
    throw new NotFoundError("Provider not found");
  }

  return SuccessResponse({
    data: { status: activeProvider.isActive },
  });
});
