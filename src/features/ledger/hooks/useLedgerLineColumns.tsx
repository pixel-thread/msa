'use client';
import { ColumnDef } from '@tanstack/react-table';
import type { LedgerLineResponse } from './useLedgerEntries';
import Link from 'next/link';

interface UseLedgerLineColumnsOptions {
  getAccountName: (accountId: string) => string;
}

export function useLedgerLineColumns(options: UseLedgerLineColumnsOptions) {
  const { getAccountName } = options;

  const columns: ColumnDef<LedgerLineResponse>[] = [
    {
      accessorKey: 'accountId',
      header: 'Account',
      cell: ({ row }) => (
        <Link
          href={`/accounts/${row.original.accountId}`}
          className="text-sm text-ink hover:underline"
        >
          {getAccountName(row.original.accountId)}
        </Link>
      ),
    },
    {
      accessorKey: 'isDebit',
      header: 'Type',
      cell: ({ row }) => {
        const isDebit = row.original.isDebit;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
              isDebit ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
            }`}
          >
            {isDebit ? 'Debit' : 'Credit'}
          </span>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: () => <span className="text-right">Amount</span>,
      cell: ({ row }) => (
        <span className="text-sm text-right font-mono text-ink block">
          ₹
          {Number(row.original.amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
  ];
  return { columns };
}
