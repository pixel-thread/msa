import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError, NotFoundError } from "@src/shared/errors";
import { getTraceId } from "@src/shared/utils";
import { logger } from "@src/shared/logger/server";

const SetDefaultPlanSchema = z.object({
  planId: z.string().uuid(),
});

export const POST = withAssociation(
  { body: SetDefaultPlanSchema },
  async (association, { body }, request) => {
    const traceId = getTraceId(request);
    await withRole(request, UserRole.SUPER_ADMIN);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    logger.info({ traceId, planId: body.planId }, "Verifying plan exists");

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        id: body.planId,
        associationId: association.id,
      },
    });

    if (!plan) {
      throw new NotFoundError("Plan not found in this association");
    }

    logger.info({ traceId, planId: body.planId }, "Setting plan as default");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlan.updateMany({
        where: { associationId: association.id },
        data: { isDefault: false },
      });

      return tx.subscriptionPlan.update({
        where: { id: body.planId },
        data: { isDefault: true },
      });
    });

    logger.info({ traceId, planId: updated.id }, "Default plan updated successfully");

    return SuccessResponse({ data: updated });
  },
);
