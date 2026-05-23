import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { buildPagination } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { pageNumberValidation } from "@src/shared/validators";
import { PAGE_SIZE } from "@src/shared/constants";
import { z } from "zod";

const QuerySchema = z.object({
  page: pageNumberValidation,
});

export const GET = withAssociation(
  { query: QuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.MEMBER);
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

    return SuccessResponse({
      data: meetings,
      meta: buildPagination(total, page),
    });
  },
);
