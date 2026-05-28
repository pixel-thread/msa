import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";
import { pageNumberValidation } from "@src/shared/validators";
import { buildPagination } from "@src/shared/utils";
import { PAGE_SIZE } from "@src/shared/constants";
import { logger } from "@src/shared/logger";

const CreateAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});
const AccountQuerySchema = z.object({
  page: pageNumberValidation,
});
export const GET = withAssociation(
  { query: AccountQuerySchema },
  async (association, { query, traceId }, request) => {
    logger.info("GET /api/ledger/accounts - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(request, UserRole.FINANCE);

    logger.info("GET /api/ledger/accounts - User authorized", {
      traceId,
      userId: user.id,
    });

    const page = query?.page || 1;

    const [accounts, total] = await prisma.$transaction([
      prisma.account.findMany({
        where: {
          associationId: association.id,
          isActive: true,
        },
        orderBy: {
          code: "asc",
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),

      prisma.account.count({
        where: {
          associationId: association.id,
          isActive: true,
        },
      }),
    ]);

    logger.info("GET /api/ledger/accounts - Success", {
      traceId,
      count: accounts.length,
    });

    return SuccessResponse({
      data: accounts,
      meta: buildPagination(total, page),
    });
  },
);

export const POST = withAssociation(
  { body: CreateAccountSchema },
  async (association, { body, traceId }, request) => {
    logger.info("POST /api/ledger/accounts - Request started", {
      traceId,
      associationId: association.id,
    });

    const user = await withRole(request, UserRole.FINANCE);

    logger.info("POST /api/ledger/accounts - User authorized", {
      traceId,
      userId: user.id,
    });

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const account = await prisma.account.create({
      data: {
        ...body,
        associationId: association.id,
      },
    });

    logger.info("POST /api/ledger/accounts - Success", {
      traceId,
      accountId: account.id,
    });

    return SuccessResponse({ data: account }, 201);
  },
);
