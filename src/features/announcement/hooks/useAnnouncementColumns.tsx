import { ColumnDef } from '@tanstack/react-table';
import { AnnouncementActionsCell } from '@src/features/announcement/components/cells/announcement-actions-cell';
import type { Announcement } from '../types';
import Link from 'next/link';

interface UseAnnouncementColumnsOptions {
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
}

export function useAnnouncementColumns({ onEdit, onDelete }: UseAnnouncementColumnsOptions) {
  const columns: ColumnDef<Announcement>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link href={`/announcement/${row.original.id}`} className="flex items-center gap-2">
          {row.original.isPinned && (
            <span className="text-amber-500" title="Pinned">
              📌
            </span>
          )}
          <span className="text-sm font-medium">{row.original.title}</span>
        </Link>
      ),
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: ({ row }) => <span className="text-sm">{row.original.summary || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.status.toLowerCase()}</span>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.priority.toLowerCase()}</span>
      ),
    },
    {
      accessorKey: 'author',
      header: 'Author',
      cell: ({ row }) => <span className="text-sm">{row.original.author.name || '—'}</span>,
    },
    {
      accessorKey: 'readReceipts',
      header: 'Reads',
      cell: ({ row }) => <span className="text-sm">{row.original._count.readReceipts}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <AnnouncementActionsCell announcement={row.original} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];
  return { columns };
}
