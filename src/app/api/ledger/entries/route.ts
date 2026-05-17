import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { CreateLedgerEntrySchema, LedgerQueryParams } from "@src/features/ledger/validators";
import { ValidationError } from "@src/shared/errors";

export const GET = withAssociation(
  { query: LedgerQueryParams },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);

    const { page = 1, pageSize = 20 } = query || {};
    const skip = (page - 1) * pageSize;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        include: {
          lines: true,
          paymentTransaction: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.ledgerEntry.count(),
    ]);

    return SuccessResponse({
      data: entries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page < Math.ceil(total / pageSize),
      },
    });
  }
);

export const POST = withAssociation(
  { body: CreateLedgerEntrySchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);
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

    return SuccessResponse({ data: entry }, 201);
  }
);
