import { ColumnDef } from '@tanstack/react-table';
import { ConsentStatus } from '@prisma/client';
import { Badge } from '@src/shared/components/ui/badge';
import { ConsentActionsCell } from '../components/cells/consent-actions-cell';
import type { ConsentRecord } from '../types/consent.types';

interface UseConsentColumnsOptions {
  onViewDetail: (record: ConsentRecord) => void;
  onEdit: (record: ConsentRecord) => void;
  onDelete: (record: ConsentRecord) => void;
}

const statusStyles: Record<ConsentStatus, string> = {
  [ConsentStatus.GRANTED]: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
  [ConsentStatus.WITHDRAWN]: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
};

const purposeLabels: Record<string, string> = {
  PAYMENTS: 'Payments',
  COMMUNICATIONS: 'Communications',
  MEETINGS: 'Meetings',
  ANALYTICS: 'Analytics',
  MARKETING: 'Marketing',
};

export function useConsentColumns({ onViewDetail, onEdit, onDelete }: UseConsentColumnsOptions) {
  const columns: ColumnDef<ConsentRecord>[] = [
    {
      accessorKey: 'user',
      header: 'Member',
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink">{user?.name || 'Unknown'}</span>
            {user?.email && <span className="text-xs text-body">{user.email}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'purpose',
      header: 'Purpose',
      cell: ({ row }) => <span className="text-sm">{purposeLabels[row.original.purpose]}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${statusStyles[row.original.status]}`}
        >
          {row.original.status === ConsentStatus.GRANTED ? 'Granted' : 'Withdrawn'}
        </Badge>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }) => (
        <span className="text-sm capitalize text-body">{row.original.channel}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-body">
          {new Date(row.original.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ConsentActionsCell
          record={row.original}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return { columns };
}
