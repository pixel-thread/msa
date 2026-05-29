import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { DsarActionsCell } from '../components/cells/dsar-actions-cell';
import type { DsarTicketRecord } from '../types';

interface UseDsarColumnsOptions {
  onViewDetail: (record: DsarTicketRecord) => void;
  onRespond: (record: DsarTicketRecord) => void;
  onAssign: (record: DsarTicketRecord) => void;
  onDelete: (record: DsarTicketRecord) => void;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
  IN_PROGRESS: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
  COMPLETED: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
  REJECTED: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
};

const requestTypeLabels: Record<string, string> = {
  ACCESS: 'Access',
  DELETION: 'Deletion',
  PORTABILITY: 'Portability',
  RECTIFICATION: 'Rectification',
  RESTRICTION: 'Restriction',
  OBJECTION: 'Objection',
};

export function useDsarColumns({
  onViewDetail,
  onRespond,
  onAssign,
  onDelete,
}: UseDsarColumnsOptions) {
  const columns: ColumnDef<DsarTicketRecord>[] = [
    {
      accessorKey: 'ticketNumber',
      header: 'Ticket',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-ink font-mono">{row.original.ticketNumber}</span>
      ),
    },
    {
      accessorKey: 'member',
      header: 'Member',
      cell: ({ row }) => {
        const member = row.original.member;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-ink">{member?.name || 'Unknown'}</span>
            {member?.email && <span className="text-xs text-body">{member.email}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'requestType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-sm">
          {requestTypeLabels[row.original.requestType] || row.original.requestType}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${statusStyles[row.original.status] || ''}`}
        >
          {row.original.status === 'IN_PROGRESS'
            ? 'In Progress'
            : row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => {
        const assigned = row.original.assignedTo;
        return <span className="text-sm text-body">{assigned?.name || '-'}</span>;
      },
    },
    {
      accessorKey: 'responseDeadline',
      header: 'Deadline',
      cell: ({ row }) => (
        <span className="text-sm text-body">
          {new Date(row.original.responseDeadline).toLocaleDateString('en-IN', {
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
        <DsarActionsCell
          record={row.original}
          onViewDetail={onViewDetail}
          onRespond={onRespond}
          onAssign={onAssign}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return { columns };
}
