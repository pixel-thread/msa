import { ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback } from '@src/shared/components/ui/avatar';
import { getInitials } from '@src/features/members/utils/helper/get-initials';
import { MembershipApplicationActionsCell } from '@src/features/membership-applications/components/cells/application-actions-cell';
import { MembershipApplicationListItem } from '../types';

interface UseMembershipApplicationColumnsOptions {
  onReview: (application: MembershipApplicationListItem) => void;
  onReject: (applicationId: string) => void;
  isRejecting: boolean;
}

export function useMembershipApplicationColumns({
  onReview,
  onReject,
  isRejecting,
}: UseMembershipApplicationColumnsOptions) {
  const columns: ColumnDef<MembershipApplicationListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Applicant',
      cell: ({ row }) => {
        const app = row.original;
        const fullName = `${app.firstName ?? ''} ${app.lastName}`.trim();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{fullName}</span>
              <span className="text-xs text-muted-foreground">{app.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
    },
    {
      accessorKey: 'age',
      header: 'Age',
      cell: ({ row }) => <span className="text-sm">{row.original.age}</span>,
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => <span className="text-sm">{row.original.gender}</span>,
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const { city, state } = row.original;
        const location = [city, state].filter(Boolean).join(', ');
        return <span className="text-sm">{location || '—'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors: Record<string, string> = {
          PENDING: 'bg-yellow-100 text-yellow-800',
          APPROVED: 'bg-green-100 text-green-800',
          REJECTED: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-800'}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Applied',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <MembershipApplicationActionsCell
          application={row.original}
          onReview={onReview}
          onReject={onReject}
          isRejecting={isRejecting}
        />
      ),
    },
  ];
  return { columns };
}
