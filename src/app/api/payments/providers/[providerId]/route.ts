import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import {
  UpdatePaymentProviderSchema,
  ProviderIdParamSchema,
} from "@src/features/payments/validators";
import {
  getProviderById,
  updateProvider,
  deleteProvider,
} from "@src/features/payments/services/payment-provider.service";

export const GET = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }) => {
    const provider = await getProviderById(params!.providerId, association.id);

    if (!provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404,
      });
    }

    return SuccessResponse({ data: provider });
  },
);

export const PATCH = withAssociation(
  { params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema },
  async (association, { body, params }) => {
    const result = await updateProvider(params!.providerId, association.id, {
      keyId: body?.keyId,
      keySecret: body?.keySecret,
      webhookSecret: body?.webhookSecret,
      isActive: body?.isActive,
    });

    return SuccessResponse({ data: result });
  },
);

export const DELETE = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }) => {
    await deleteProvider(params!.providerId, association.id);
    return new Response(null, { status: 204 });
  },
);
