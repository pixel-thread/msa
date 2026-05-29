import { ColumnDef } from '@tanstack/react-table';
import { MemberTypeActionsCell } from '@src/features/member-type/components/cells/member-type-actions-cell';

interface MemberType {
  id: string;
  level: number;
  description: string | null;
  _count: {
    users: number;
    subscriptionPlans: number;
  };
}

interface UseMemberTypeColumnsOptions {
  onEdit: (memberType: MemberType) => void;
  onDelete: (memberType: MemberType) => void;
}

export function useMemberTypeColumns({ onEdit, onDelete }: UseMemberTypeColumnsOptions) {
  const columns: ColumnDef<MemberType>[] = [
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => <span className="text-sm font-medium">Level {row.original.level}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="text-sm">{row.original.description || '—'}</span>,
    },
    {
      accessorKey: 'users',
      header: 'Members',
      cell: ({ row }) => <span className="text-sm">{row.original._count.users}</span>,
    },
    {
      accessorKey: 'subscriptionPlans',
      header: 'Plans',
      cell: ({ row }) => <span className="text-sm">{row.original._count.subscriptionPlans}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <MemberTypeActionsCell memberType={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
  return { columns };
}
