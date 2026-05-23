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
  async (association, { query }, request, { params }) => {
    await withRole(request, UserRole.FINANCE);

    const { memberId } = (await params) as { memberId: string };
    const page = query?.page || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const where = { createdById: memberId };

    const [memberLedger, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        include: {
          lines: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return SuccessResponse({
      data: memberLedger,
      meta: buildPagination(total, page),
    });
  },
);
