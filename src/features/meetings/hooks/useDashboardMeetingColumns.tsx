import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { formatDate } from '@src/shared/utils';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';

interface DashboardMeeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  _count: {
    attendees: number;
  };
}

const baseColumns: ColumnDef<DashboardMeeting>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: 'scheduledAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{formatDate(row.original.scheduledAt)}</span>
    ),
  },
  {
    accessorKey: 'attendees',
    header: () => <span className="text-right">Attendees</span>,
    cell: ({ row }) => (
      <span className="text-right text-sm block ml-auto">{row.original._count.attendees}</span>
    ),
  },
];

export const useDashboardMeetingColumns = (): {
  columns: ColumnDef<DashboardMeeting>[];
} => {
  const columns: ColumnDef<DashboardMeeting>[] = [...baseColumns];
  return { columns };
};
