'use client';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { formattedAmount } from '@src/shared/utils';
import { getMonthName } from '@src/shared/utils/helper/get-month-name';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';
import type { ContributionPeriod } from '../types';

export function useContributionPeriodColumns() {
  const columns: ColumnDef<ContributionPeriod>[] = [
    {
      accessorKey: 'user',
      header: 'Member',
      cell: ({ row }) => {
        const cp = row.original;
        return (
          <>
            <Link
              href={`/payments/users/${cp.userId}`}
              className="text-sm text-primary hover:underline"
            >
              {cp.user?.name || cp.userId.slice(0, 8)}
            </Link>
            {cp.user?.email && <div className="text-xs text-muted-foreground">{cp.user.email}</div>}
          </>
        );
      },
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {getMonthName(row.original.month)} {row.original.year}
        </span>
      ),
    },
    {
      accessorKey: 'expectedAmount',
      header: 'Expected',
      cell: ({ row }) => (
        <span className="text-sm">{formattedAmount(row.original.expectedAmount)}</span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid',
      cell: ({ row }) => (
        <span className="text-sm text-green-600">{formattedAmount(row.original.paidAmount)}</span>
      ),
    },
    {
      accessorKey: 'dueAmount',
      header: 'Due',
      cell: ({ row }) => (
        <span className="text-sm text-red-600">{formattedAmount(row.original.dueAmount)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.dueDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];
  return { columns };
}
