import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { PAGE_SIZE } from "@src/shared/constants";
import { ComplaintQuerySchema, CreateComplaintSchema } from "@src/features/compliance/validators";
import { createComplaint } from "@src/features/compliance/services";
import { logger } from "@src/shared/logger";

export const GET = withAssociation(
  { query: ComplaintQuerySchema },
  async (association, { query, traceId }, req) => {
    logger.info("GET /api/compliance - Request started", { traceId, associationId: association.id });
    const user = await withRole(req, UserRole.DPO);
    logger.info("GET /api/compliance - User authorized", { traceId, userId: user.id, roles: user.role });

    const where: Record<string, unknown> = {
      associationId: association.id,
    };

    if (query?.status) {
      where.status = query.status;
    }
    if (query?.priority) {
      where.priority = query.priority;
    }
    if (query?.fromDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        gte: new Date(query.fromDate),
      };
    }
    if (query?.toDate) {
      where.createdAt = {
        ...((where.createdAt as object) || {}),
        lte: new Date(query.toDate),
      };
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: ((query?.page ?? 1) - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await prisma.complaint.count({ where });

    logger.info("GET /api/compliance - Success", { traceId, count: complaints.length });

    return SuccessResponse({
      data: complaints,
      meta: buildPagination(total, query?.page ?? 1),
    });
  },
);

export const POST = withAssociation(
  { body: CreateComplaintSchema },
  async (association, { body, traceId }, request) => {
    logger.info("POST /api/compliance - Request started", { traceId, associationId: association.id });
    const userId = request.headers.get("x-user-id")!;

    const complaint = await createComplaint({
      associationId: association.id,
      userId,
      data: body!,
    });

    logger.info("POST /api/compliance - Success", { traceId, complaintId: complaint.id });

    return SuccessResponse({ data: complaint }, 201);
  },
);
