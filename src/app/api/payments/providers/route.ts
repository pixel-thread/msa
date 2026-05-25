import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UpsertPaymentProviderSchema } from "@src/features/payments/validators";
import {
  getProvidersByAssociation,
  createProvider,
} from "@src/features/payments/services/payment-provider.service";
import { PaymentProviderType } from "@prisma/client";

export const POST = withAssociation(
  { body: UpsertPaymentProviderSchema },
  async (association, { body }) => {
    const result = await createProvider({
      associationId: association.id,
      provider: body!.provider as PaymentProviderType,
      keyId: body!.keyId,
      keySecret: body!.keySecret,
      webhookSecret: body!.webhookSecret,
      isActive: body!.isActive,
    });

    return SuccessResponse({ data: result }, 201);
  },
);

export const GET = withAssociation({}, async (association) => {
  const providers = await getProvidersByAssociation(association.id);
  return SuccessResponse({ data: providers });
});
