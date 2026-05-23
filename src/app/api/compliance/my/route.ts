import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { ComplaintQuerySchema } from "@src/features/compliance/validators";

export const GET = withAssociation(
  { query: ComplaintQuerySchema },
  async (association, { query }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const where: Record<string, unknown> = {
      associationId: association.id,
      userId,
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
