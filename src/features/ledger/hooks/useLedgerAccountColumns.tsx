import { type ColumnDef } from '@tanstack/react-table';
import type { Account } from '@src/shared/types';

export function useLedgerAccountColumns() {
  const columns: ColumnDef<Account>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <span className="text-sm font-mono text-ink">{row.original.code}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="text-sm text-ink">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
              type === 'ASSET'
                ? 'bg-blue-50 text-blue-700'
                : type === 'LIABILITY'
                  ? 'bg-orange-50 text-orange-700'
                  : type === 'EQUITY'
                    ? 'bg-green-50 text-green-700'
                    : type === 'INCOME'
                      ? 'bg-purple-50 text-purple-700'
                      : type === 'EXPENSE'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-50 text-gray-700'
            }`}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span>
      ),
    },
  ];

  return { columns };
}
