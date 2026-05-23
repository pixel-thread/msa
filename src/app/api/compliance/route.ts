import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { ComplaintQuerySchema } from "@src/features/compliance/validators";

export const GET = withAssociation(
  { query: ComplaintQuerySchema },
  async (association, { query }, req) => {
    withRole(req, UserRole.DPO);

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
      skip: ((query?.page ?? 1) - 1) * (query?.limit ?? 20),
      take: query?.limit ?? 20,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await prisma.complaint.count({ where });

    return SuccessResponse({
      data: complaints,
      meta: buildPagination(total, query?.page ?? 1, query?.limit ?? 20),
    });
  },
);
