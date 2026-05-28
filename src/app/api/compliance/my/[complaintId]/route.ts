import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { ComplaintParamsSchema } from "@src/features/compliance/validators";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  { params: ComplaintParamsSchema },
  async (association, { params, traceId }, req) => {
    logger.info("GET /api/compliance/my/[complaintId] - Request started", { traceId, associationId: association.id, complaintId: params?.complaintId });
    if (!params) {
      logger.error("GET /api/compliance/my/[complaintId] - Invalid complaint ID (missing params)", { traceId });
      throw new BadRequestError("Invalid complaint ID");
    }

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      logger.error("GET /api/compliance/my/[complaintId] - Unauthorized (missing x-user-id)", { traceId });
      throw new UnauthorizedError("Unauthorized");
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        id: params.complaintId,
        associationId: association.id,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!complaint) {
      logger.error("GET /api/compliance/my/[complaintId] - Complaint not found", { traceId, complaintId: params.complaintId });
      throw new NotFoundError("Complaint not found");
    }

    logger.info("GET /api/compliance/my/[complaintId] - Success", { traceId, complaintId: params.complaintId });

    return SuccessResponse({ data: complaint });
  },
);
