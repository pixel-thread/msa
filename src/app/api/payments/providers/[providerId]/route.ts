import { withAssociation, withRole } from "@src/shared/api";
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
import { NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";

export const GET = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params }, req) => {
    await withRole(req, UserRole.PRESIDENT);
    const provider = await getProviderById(params!.providerId, association.id);

    if (!provider) {
      throw new NotFoundError("Provider not found");
    }

    return SuccessResponse({ data: provider });
  },
);

export const PATCH = withAssociation(
  { params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema },
  async (association, { body, params }, req) => {
    await withRole(req, UserRole.PRESIDENT);
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
  async (association, { params }, req) => {
    await withRole(req, UserRole.PRESIDENT);
    await deleteProvider(params!.providerId, association.id);
    return SuccessResponse({
      data: null,
      message: "Provider deleted successfully",
    });
  },
);
