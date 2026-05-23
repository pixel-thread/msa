import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ProviderIdParamSchema } from "@src/features/payments/validators";
import {
  getProviderById,
  setActiveProvider,
} from "@src/features/payments/services/payment-provider.service";
import { UserRole } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@src/shared/errors";

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }, req) => {
    await withRole(req, UserRole.PRESIDENT);

    const providerId = params?.providerId;

    if (!providerId) throw new BadRequestError("Invalid provider ID");

    const provderExist = await getProviderById(providerId, association.id);

    if (!provderExist) {
      throw new NotFoundError("Provider not found");
    }

    const result = await setActiveProvider(provderExist.id, association.id);

    return SuccessResponse({ data: result });
  },
);
