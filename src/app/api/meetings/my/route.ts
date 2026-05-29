import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { buildPagination } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { pageNumberValidation } from "@src/shared/validators";
import { PAGE_SIZE } from "@src/shared/constants";
import { logger } from "@src/shared/logger/server";
import { z } from "zod";

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info({ traceId, associationId: association.id }, "GET /api/meetings/my - Request started");

    const user = await withRole(request, UserRole.MEMBER);
    logger.info({ traceId, userId: user.id, role: user.role }, "GET /api/meetings/my - User authorized");

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

    logger.info({ traceId, count: meetings.length }, "GET /api/meetings/my - Success");

    return SuccessResponse({
      data: meetings,
      meta: buildPagination(total, page),
    });
  },
);
