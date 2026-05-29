'use client';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils/format';
import type { LedgerEntryResponse } from './useLedgerEntries';

export function useRecentLedgerEntryColumns() {
  const columns: ColumnDef<LedgerEntryResponse>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-ink max-w-[300px] block truncate">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'approvalStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.approvalStatus;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
              status === 'APPROVED'
                ? 'bg-green-50 text-green-700'
                : status === 'REJECTED'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'lines',
      header: 'Lines',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.lines.length}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];
  return { columns };
}
