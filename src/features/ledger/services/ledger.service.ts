import { Prisma } from '@prisma/client';

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
