import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
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
  async (association, { params, traceId }, req) => {
    logger.info("GET /api/payments/providers/[providerId] - Request started", { traceId, providerId: params!.providerId });

    await withRole(req, UserRole.PRESIDENT);
    logger.info("GET /api/payments/providers/[providerId] - User authorized", { traceId, providerId: params!.providerId });
    const provider = await getProviderById(params!.providerId, association.id);

    if (!provider) {
      throw new NotFoundError("Provider not found");
    }

    logger.info("GET /api/payments/providers/[providerId] - Success", { traceId, providerId: params!.providerId });

    return SuccessResponse({ data: provider });
  },
);

export const PATCH = withAssociation(
  { params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema },
  async (association, { body, params, traceId }, req) => {
    logger.info("PATCH /api/payments/providers/[providerId] - Request started", { traceId, providerId: params!.providerId });

    await withRole(req, UserRole.PRESIDENT);
    logger.info("PATCH /api/payments/providers/[providerId] - User authorized", { traceId, providerId: params!.providerId });
    logger.info("PATCH /api/payments/providers/[providerId] - Updating provider", { traceId, providerId: params!.providerId });

    const result = await updateProvider(params!.providerId, association.id, {
      keyId: body?.keyId,
      keySecret: body?.keySecret,
      webhookSecret: body?.webhookSecret,
      isActive: body?.isActive,
    });

    logger.info("PATCH /api/payments/providers/[providerId] - Success", { traceId, providerId: params!.providerId });

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
