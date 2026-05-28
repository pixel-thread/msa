import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { buildPagination } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { pageNumberValidation } from "@src/shared/validators";
import { PAGE_SIZE } from "@src/shared/constants";
import { logger } from "@src/shared/logger";
import { z } from "zod";

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/meetings/my - Request started", { traceId, associationId: association.id });

    const user = await withRole(request, UserRole.MEMBER);
    logger.info("GET /api/meetings/my - User authorized", { traceId, userId: user.id, role: user.role });

    const userId = request.headers.get("x-user-id")!;
    const page = query?.page || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const where = {
      associationId: association.id,
      attendees: {
        some: {
          userId,
        },
      },
    };

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        include: {
          attendees: {
            where: { userId },
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    logger.info("GET /api/meetings/my - Success", { traceId, count: meetings.length });

    return SuccessResponse({
      data: meetings,
      meta: buildPagination(total, page),
    });
  },
);
