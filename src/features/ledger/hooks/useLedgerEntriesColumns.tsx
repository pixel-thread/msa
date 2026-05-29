import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { formatDate } from '@src/shared/utils/format';
import type { LedgerEntryResponse } from './useLedgerEntries';
import Link from 'next/link';

interface UseLedgerEntriesColumnsOptions {
  onViewDetails?: (entry: LedgerEntryResponse) => void;
  onApprove?: (entry: LedgerEntryResponse) => void;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  APPROVED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive',
};

export function useLedgerEntriesColumns({
  onViewDetails,
  onApprove,
}: UseLedgerEntriesColumnsOptions = {}) {
  const columns: ColumnDef<LedgerEntryResponse>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <Link
          href={`/ledger/entries/${row.original.id}`}
          className="text-sm text-ink max-w-[300px] block truncate hover:underline"
        >
          {row.original.description}
        </Link>
      ),
    },
    {
      accessorKey: 'approvalStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusBadgeVariant[row.original.approvalStatus] ?? 'outline'}>
          {row.original.approvalStatus}
        </Badge>
      ),
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
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div>
          {row.original.approvalStatus === 'PENDING' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onApprove?.(row.original)}
            >
              Approve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return { columns };
}
