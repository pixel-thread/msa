'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { MeetingMinute } from '@src/features/meetings/hooks/useMeetingMinutes';

interface UseMeetingMinutesColumnsOptions {
  onEdit: (minute: MeetingMinute) => void;
  onDelete: (minute: MeetingMinute) => void;
}

export function useMeetingMinutesColumns(options: UseMeetingMinutesColumnsOptions) {
  const { onEdit, onDelete } = options;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns: ColumnDef<MeetingMinute>[] = [
    {
      accessorKey: 'agendaPoint',
      header: 'Agenda Point',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.agendaPoint}</span>,
    },
    {
      accessorKey: 'decision',
      header: 'Decision',
      cell: ({ row }) => (
        <span className="text-sm text-body line-clamp-2">{row.original.decision}</span>
      ),
    },
    {
      id: 'actionItems',
      header: 'Action Items',
      cell: ({ row }) => {
        const items = row.original.actionItems;
        return items && items.length > 0 ? (
          <div className="flex flex-col gap-1">
            {items.slice(0, 2).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs justify-start">
                {item.task}
              </Badge>
            ))}
            {items.length > 2 && (
              <span className="text-xs text-muted-foreground">+{items.length - 2} more</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        );
      },
    },
    {
      accessorKey: 'recordedAt',
      header: 'Recorded',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.recordedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  return { columns };
}
