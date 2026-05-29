'use client';

import { Award } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import type { TrainingCompletionItem } from '../../types';

export function useTrainingCompletionsColumns(options?: { showModule?: boolean }) {
  const columns: ColumnDef<TrainingCompletionItem>[] = [];

  if (options?.showModule) {
    columns.push({
      accessorKey: 'module.title',
      header: 'Module',
      cell: ({ row }) => {
        const m = row.original.module;
        return <span className="text-sm font-semibold text-ink">{m?.title || 'Unknown'}</span>;
      },
    });
  }

  columns.push(
    {
      accessorKey: 'user.name',
      header: 'Member',
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{u?.name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{u?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ row }) => {
        const date = row.original.completedAt;
        return <span className="text-sm text-body">{date ? formatDate(date) : '—'}</span>;
      },
    },
    {
      accessorKey: 'scorePercent',
      header: 'Score',
      cell: ({ row }) => {
        const score = row.original.scorePercent;
        return (
          <span className="text-sm text-body">
            {score !== null && score !== undefined ? (
              <span className="flex items-center gap-1 text-semantic-up font-medium">
                <Award className="h-3.5 w-3.5" />
                {score} pts
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => <span className="text-xs text-muted-foreground">—</span>,
    },
  );

  return { columns };
}
