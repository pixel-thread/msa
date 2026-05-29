import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import type { User } from '@src/shared/types';
import { RoleCell } from '@src/features/members/components/cells/role-cell';
import { StatusCell } from '@src/features/members/components/cells/status-cell';
import { NameCell } from '@src/features/members/components/cells/name-cell';
import { AssociationCell } from '@src/features/members/components/cells/association-cell';

interface UseMemberTableColumnsOptions {
  onRoleChange: (memberId: string, role: string, action: 'add' | 'remove') => void;
  onStatusChange: (memberId: string, status: string) => void;
  onAssociationChange: (memberId: string, associationId: string) => void;
}

export const useMemberTableColumns = ({
  onRoleChange,
  onStatusChange,
  onAssociationChange,
}: UseMemberTableColumnsOptions): { columns: ColumnDef<User>[] } => {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Member',
      cell: ({ row }) => <NameCell member={row.original} />,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleCell member={row.original} onRoleChange={onRoleChange} />,
    },
    {
      accessorKey: 'associationId',
      header: 'Association',
      cell: ({ row }) => (
        <AssociationCell member={row.original} onAssociationChange={onAssociationChange} />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusCell member={row.original} onStatusChange={onStatusChange} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-right text-muted-foreground text-sm block ml-auto">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return { columns };
};
