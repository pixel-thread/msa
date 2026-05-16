import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { ProviderIdParamSchema } from "@src/features/payments/validators";
import { setActiveProvider } from "@src/features/payments/services/payment-provider.service";

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }) => {
    const result = await setActiveProvider(params!.providerId, association.id);
    return SuccessResponse({ data: result });
  },
);
