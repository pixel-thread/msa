import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { ConsentService } from "@src/features/consent";
import {
  ConsentReceiptParamsSchema,
  UpdateConsentReceiptSchema,
} from "@src/features/consent/validators/consent.validators";

export const GET = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params }, request) => {
    await withRole(request, UserRole.DPO);
    if (!params) throw new BadRequestError("Invalid receipt ID");

    const receipt = await ConsentService.findUniqueConsentReceipt(
      association.id,
      params.receiptId,
    );
    if (!receipt) throw new NotFoundError("Consent receipt not found");

    return SuccessResponse({ data: receipt });
  },
);

export const PATCH = withAssociation(
  { params: ConsentReceiptParamsSchema, body: UpdateConsentReceiptSchema },
  async (association, { params, body }, request) => {
    if (!params) throw new BadRequestError("Invalid receipt ID");
    if (!body) throw new BadRequestError("Request body is required");

    const user = await withRole(request, UserRole.DPO);

    const receipt = await ConsentService.updateConsentReceipt(
      association.id,
      params.receiptId,
      user.id,
      body,
    );

    return SuccessResponse({
      data: receipt,
      message: "Consent receipt updated successfully",
    });
  },
);

export const DELETE = withAssociation(
  { params: ConsentReceiptParamsSchema },
  async (association, { params }, request) => {
    if (!params) throw new BadRequestError("Invalid receipt ID");

    const user = await withRole(request, UserRole.DPO);

    await ConsentService.deleteConsentReceipt(
      association.id,
      params.receiptId,
      user.id,
    );

    return SuccessResponse({
      data: null,
      message: "Consent receipt deleted successfully",
    });
  },
);
