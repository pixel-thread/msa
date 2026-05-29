import 'server-only';
import { Prisma, ApprovalStatus } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';
import { ValidationError, NotFoundError } from '@src/shared/errors';
import { PAGE_SIZE } from '@src/shared/constants';

// ---------------------------------------------------------------------------
// Internal: Auto-create ledger entry for payment transactions
// ---------------------------------------------------------------------------

export async function createLedgerEntry(
  tx: Prisma.TransactionClient,
  paymentTransactionId: string,
  amount: number,
  description: string,
  createdById: string,
) {
  const transaction = await tx.paymentTransaction.findUnique({
    where: { id: paymentTransactionId },
    select: { associationId: true, method: true },
  });

  if (!transaction) {
    throw new Error(`Transaction ${paymentTransactionId} not found during ledger generation.`);
  }

  const isCash = transaction.method === 'CASH';
  const debitAccountCode = isCash ? '1001' : '1002';
  const creditAccountCode = '3001';

  const [debitAccount, creditAccount] = await Promise.all([
    tx.account.findFirst({
      where: {
        associationId: transaction.associationId,
        code: debitAccountCode,
        isActive: true,
      },
    }),
    tx.account.findFirst({
      where: {
        associationId: transaction.associationId,
        code: creditAccountCode,
        isActive: true,
      },
    }),
  ]);

  if (!debitAccount || !creditAccount) {
    throw new Error(
      `Required accounts (debit: ${debitAccountCode}, credit: ${creditAccountCode}) not found in chart of accounts for association ${transaction.associationId}.`,
    );
  }

  return tx.ledgerEntry.create({
    data: {
      paymentTransactionId,
      description,
      approvalStatus: 'APPROVED',
      createdById,
      approvedById: createdById,
      lines: {
        create: [
          {
            accountId: debitAccount.id,
            isDebit: true,
            amount,
          },
          {
            accountId: creditAccount.id,
            isDebit: false,
            amount,
          },
        ],
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Ledger Entries
// ---------------------------------------------------------------------------

export interface CreateManualEntryInput {
  description: string;
  paymentId?: string | null;
  lines: Array<{
    accountId: string;
    isDebit: boolean;
    amount: number;
  }>;
}

export async function getEntries(associationId: string, page = 1) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * PAGE_SIZE;

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      include: {
        lines: true,
        paymentTransaction: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.ledgerEntry.count(),
  ]);

  return { entries, total, page: validPage };
}

export async function createManualEntry(
  associationId: string,
  userId: string,
  input: CreateManualEntryInput,
) {
  const debits = input.lines.filter((l) => l.isDebit);
  const credits = input.lines.filter((l) => !l.isDebit);

  if (debits.length === 0 || credits.length === 0) {
    throw new ValidationError('A ledger entry must have at least one debit line and one credit line.');
  }

  const totalDebits = debits.reduce((sum, l) => sum + l.amount, 0);
  const totalCredits = credits.reduce((sum, l) => sum + l.amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new ValidationError(
      `Ledger entry is not balanced. Total debits (${totalDebits.toFixed(2)}) must equal total credits (${totalCredits.toFixed(2)}).`,
    );
  }

  const accountIds = input.lines.map((l) => l.accountId);
  const uniqueAccountIds = Array.from(new Set(accountIds));
  const accountsCount = await prisma.account.count({
    where: {
      id: { in: uniqueAccountIds },
      associationId,
      isActive: true,
    },
  });

  if (accountsCount !== uniqueAccountIds.length) {
    throw new ValidationError('One or more selected accounts are invalid or inactive.');
  }

  return prisma.ledgerEntry.create({
    data: {
      description: input.description,
      createdById: userId,
      paymentTransactionId: input.paymentId || null,
      lines: {
        create: input.lines.map((line) => ({
          accountId: line.accountId,
          isDebit: line.isDebit,
          amount: line.amount,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function approveEntry(entryId: string, approvedById: string) {
  const existing = await prisma.ledgerEntry.findUnique({ where: { id: entryId } });

  if (!existing) {
    throw new NotFoundError(`Ledger entry ${entryId} not found.`);
  }

  return prisma.ledgerEntry.update({
    where: { id: entryId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedById,
    },
  });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface CreateAccountInput {
  code: string;
  name: string;
  type: string;
  description?: string;
}

export async function getAccounts(associationId: string, page = 1) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * PAGE_SIZE;

  const [accounts, total] = await prisma.$transaction([
    prisma.account.findMany({
      where: { associationId, isActive: true },
      orderBy: { code: 'asc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.account.count({
      where: { associationId, isActive: true },
    }),
  ]);

  return { accounts, total, page: validPage };
}

export async function createAccount(associationId: string, input: CreateAccountInput) {
  return prisma.account.create({
    data: {
      code: input.code,
      name: input.name,
      type: input.type,
      description: input.description,
      associationId,
    },
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export async function getSummary(associationId: string) {
  const accounts = await prisma.account.findMany({
    where: { associationId },
  });

  return { accounts, summary: 'Ledger summary placeholder' };
}

// ---------------------------------------------------------------------------
// Member-specific ledger entries
// ---------------------------------------------------------------------------

export async function getMemberEntries(memberId: string, page = 1) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * PAGE_SIZE;

  const where = { createdById: memberId };

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  return { entries, total, page: validPage };
}
