import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { ConsentService } from "@src/features/consent";
import {
  ConsentReceiptParamsSchema,
  UpdateConsentReceiptSchema,
} from "@src/features/consent/validators/consent.validators";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("GET /api/consent/[receiptId] - Request started", {
      traceId,
      associationId: association.id,
      receiptId: params?.receiptId,
    });

    const user = await withRole(request, UserRole.DPO);

    logger.info("GET /api/consent/[receiptId] - User authorized", {
      traceId,
      userId: user.id,
    });

    if (!params) throw new BadRequestError("Invalid receipt ID");

    const receipt = await ConsentService.findUniqueConsentReceipt(
      association.id,
      params.receiptId,
    );
    if (!receipt) throw new NotFoundError("Consent receipt not found");

    logger.info("GET /api/consent/[receiptId] - Success", { traceId });

    return SuccessResponse({ data: receipt });
  },
);

export const PATCH = withAssociation(
  { params: ConsentReceiptParamsSchema, body: UpdateConsentReceiptSchema },
  async (association, { params, body, traceId }, request) => {
    logger.info("PATCH /api/consent/[receiptId] - Request started", {
      traceId,
      associationId: association.id,
      receiptId: params?.receiptId,
    });

    if (!params) throw new BadRequestError("Invalid receipt ID");
    if (!body) throw new BadRequestError("Request body is required");

    const user = await withRole(request, UserRole.DPO);

    logger.info("PATCH /api/consent/[receiptId] - User authorized", {
      traceId,
      userId: user.id,
    });

    const receipt = await ConsentService.updateConsentReceipt(
      association.id,
      params.receiptId,
      user.id,
      body,
    );

    logger.info("PATCH /api/consent/[receiptId] - Success", { traceId });

    return SuccessResponse({
      data: receipt,
      message: "Consent receipt updated successfully",
    });
  },
);

export const DELETE = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("DELETE /api/consent/[receiptId] - Request started", {
      traceId,
      associationId: association.id,
      receiptId: params?.receiptId,
    });

    if (!params) throw new BadRequestError("Invalid receipt ID");

    const user = await withRole(request, UserRole.DPO);

    logger.info("DELETE /api/consent/[receiptId] - User authorized", {
      traceId,
      userId: user.id,
    });

    await ConsentService.deleteConsentReceipt(
      association.id,
      params.receiptId,
      user.id,
    );

    logger.info("DELETE /api/consent/[receiptId] - Success", { traceId });

    return SuccessResponse({
      data: null,
      message: "Consent receipt deleted successfully",
    });
  },
);
