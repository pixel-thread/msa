import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { UserRole, Prisma } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { ComplianceCheckParamsSchema } from "@src/features/compliance/validators";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("GET /api/compliance/checks/[checkId] - Request started", { traceId, associationId: association.id, checkId: params?.checkId });
    const user = await withRole(request, UserRole.DPO);
    logger.info("GET /api/compliance/checks/[checkId] - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!params) {
      logger.error("GET /api/compliance/checks/[checkId] - Invalid check ID", { traceId });
      throw new BadRequestError("Invalid check ID");
    }

    const check = await prisma.complianceCheck.findFirst({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!check) {
      logger.error("GET /api/compliance/checks/[checkId] - Compliance check not found", { traceId, checkId: params.checkId });
      throw new NotFoundError("Compliance check not found");
    }

    logger.info("GET /api/compliance/checks/[checkId] - Success", { traceId, checkId: params.checkId });

    return SuccessResponse({ data: check });
  },
);

export const DELETE = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info("DELETE /api/compliance/checks/[checkId] - Request started", { traceId, associationId: association.id, checkId: params?.checkId });
    const user = await withRole(request, UserRole.DPO);
    logger.info("DELETE /api/compliance/checks/[checkId] - User authorized", { traceId, userId: user.id, roles: user.role });

    if (!params) {
      logger.error("DELETE /api/compliance/checks/[checkId] - Invalid check ID", { traceId });
      throw new BadRequestError("Invalid check ID");
    }

    const existing = await prisma.complianceCheck.findFirst({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!existing) {
      logger.error("DELETE /api/compliance/checks/[checkId] - Compliance check not found", { traceId, checkId: params.checkId });
      throw new NotFoundError("Compliance check not found");
    }

    await prisma.complianceCheck.delete({
      where: { id: params.checkId },
    });

    logger.info("DELETE /api/compliance/checks/[checkId] - Success", { traceId, checkId: params.checkId });

    return SuccessResponse({
      data: null,
      message: "Compliance check deleted successfully",
    });
  },
);
