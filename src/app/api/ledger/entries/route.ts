import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import {
  CreateLedgerEntrySchema,
  LedgerQueryParams,
} from "@src/features/ledger/validators";
import { ValidationError } from "@src/shared/errors";
import { buildPagination } from "@src/shared/utils";
import { PAGE_SIZE } from "@src/shared/constants";
import { logger } from "@src/shared/logger/server";

export const GET = withAssociation(
  { query: LedgerQueryParams },
  async (association, { query, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      "GET /api/ledger/entries - Request started",
    );

    const user = await withRole(request, UserRole.FINANCE);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      "GET /api/ledger/entries - User authorized",
    );

    const { page = 1 } = query || {};
    const skip = (page - 1) * PAGE_SIZE;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        include: {
          lines: true,
          paymentTransaction: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.ledgerEntry.count(),
    ]);

    logger.info(
      {
        traceId,
        count: entries.length,
      },
      "GET /api/ledger/entries - Success",
    );

    return SuccessResponse({
      data: entries,
      meta: buildPagination(total, page),
    });
  },
);

export const POST = withAssociation(
  { body: CreateLedgerEntrySchema },
  async (association, { body, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      "POST /api/ledger/entries - Request started",
    );

    const user = await withRole(request, UserRole.FINANCE);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      "POST /api/ledger/entries - User authorized",
    );

    const userId = request.headers.get("x-user-id")!;

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        description: body.description,
        createdById: userId,
        paymentTransactionId: body.paymentId || null,
        lines: {
          create: body.lines.map((line) => ({
            accountId: line.debitAccountId,
            isDebit: true,
            amount: line.amount,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    logger.info(
      {
        traceId,
        entryId: entry.id,
      },
      "POST /api/ledger/entries - Success",
    );

    return SuccessResponse({ data: entry }, 201);
  },
);
