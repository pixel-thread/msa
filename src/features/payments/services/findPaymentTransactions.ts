import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/prisma';

type Props = {
  where: Prisma.PaymentTransactionWhereInput;
  page?: number;
  pageSize?: number;
  include?: Prisma.PaymentTransactionInclude;
};

export async function findPaymentTransactions({ where, page = 1, pageSize = 20, include }: Props) {
  const skip = (page - 1) * pageSize;
  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include,
      orderBy: { paymentDate: 'desc' },
      take: pageSize,
      skip,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);
  return { transactions, total };
}
