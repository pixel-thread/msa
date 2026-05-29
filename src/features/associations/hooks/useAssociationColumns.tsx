import type { ColumnDef } from '@tanstack/react-table';
import { AssociationActionsCell } from '@feature/associations/components/cells/association-actions-cell';
import { Association } from '@feature/associations/types/association';

interface UseAssociationColumnsOptions {
  onEdit: (association: Association) => void;
  onDeactivate: (association: Association) => void;
}

export function useAssociationColumns({ onEdit, onDeactivate }: UseAssociationColumnsOptions) {
  const columns: ColumnDef<Association>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.slug}</span>,
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }) => <span className="text-sm">{row.original.country}</span>,
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => <span className="text-sm">{row.original.state || '—'}</span>,
    },
    {
      accessorKey: 'contactEmail',
      header: 'Contact Email',
      cell: ({ row }) => <span className="text-sm">{row.original.contactEmail || '—'}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium ${
            row.original.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <AssociationActionsCell
          association={row.original}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
        />
      ),
    },
  ];

  return { columns };
}
