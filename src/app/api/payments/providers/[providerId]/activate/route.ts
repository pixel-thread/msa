import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { logger } from "@src/shared/logger";
import { ProviderIdParamSchema } from "@src/features/payments/validators";
import {
  getProviderById,
  setActiveProvider,
} from "@src/features/payments/services/payment-provider.service";
import { UserRole } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@src/shared/errors";

export const POST = withAssociation(
  { params: ProviderIdParamSchema },
  async (association, { params, traceId }, req) => {
    logger.info("POST /api/payments/providers/[providerId]/activate - Request started", { traceId, providerId: params?.providerId });

    await withRole(req, UserRole.PRESIDENT);
    logger.info("POST /api/payments/providers/[providerId]/activate - User authorized", { traceId, providerId: params?.providerId });

    const providerId = params?.providerId;

    if (!providerId) throw new BadRequestError("Invalid provider ID");

    const provderExist = await getProviderById(providerId, association.id);

    if (!provderExist) {
      throw new NotFoundError("Provider not found");
    }

    logger.info("POST /api/payments/providers/[providerId]/activate - Toggling provider activation", { traceId, providerId });
    const result = await setActiveProvider(provderExist.id, association.id);

    const activatedMessage = "Provider successfully activated";
    const deActivatedMessage = "Provider successfully de-activated";
    logger.info("POST /api/payments/providers/[providerId]/activate - Success", { traceId, providerId, isActive: result.isActive });

    return SuccessResponse({
      data: result,
      message: result.isActive ? activatedMessage : deActivatedMessage,
    });
  },
);
