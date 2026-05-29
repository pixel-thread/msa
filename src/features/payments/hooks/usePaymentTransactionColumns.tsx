'use client';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Badge } from '@src/shared/components/ui/badge';
import { formatDate, formattedAmount } from '@src/shared/utils';
import { getMethodBadge } from '@src/shared/utils/helper/get-method-badge';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';
import type { PaymentTransaction } from '../types';

export function usePaymentTransactionColumns() {
  const columns: ColumnDef<PaymentTransaction>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatDate(row.original.paymentDate)}</span>
          {row.original.notes && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.notes}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <>
            <Link
              href={`/payments/users/${tx.userId}`}
              className="text-sm text-primary hover:underline"
            >
              {tx.user?.name || tx.userId.slice(0, 8)}
            </Link>
            {tx.user?.email && <div className="text-xs text-muted-foreground">{tx.user.email}</div>}
          </>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formattedAmount(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => getMethodBadge(row.original.method),
    },
    {
      accessorKey: 'gateway',
      header: 'Gateway',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.gateway.toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <Link href={`/payments/${tx.id}`} className="text-xs text-primary hover:underline">
            {tx.referenceNumber || tx.receiptNumber || tx.razorpayPaymentId || tx.id.slice(0, 8)}
          </Link>
        );
      },
    },
  ];
  return { columns };
}
