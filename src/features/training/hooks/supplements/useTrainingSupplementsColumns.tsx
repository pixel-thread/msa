'use client';

import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import type { TrainingSupplementItem } from '../../types';

export function useTrainingSupplementsColumns(options: { supplements: TrainingSupplementItem[] }) {
  const { supplements } = options;

  const [supplementToDelete, setSupplementToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleDeleteSupplement = (supplementId: string) => {
    const supplement = supplements?.find((s) => s.id === supplementId);
    setSupplementToDelete(
      supplement
        ? { id: supplement.id, title: supplement.title }
        : { id: supplementId, title: 'this supplement' },
    );
  };

  const supplementColumns: ColumnDef<TrainingSupplementItem>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <a target="_blank" href={s.imageUrl || ''} className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{s.title}</span>
            {s.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">{s.description}</span>
            )}
          </a>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'fileSize',
      header: 'Size',
      cell: ({ row }) => {
        const bytes = row.original.fileSize;
        if (bytes === null || bytes === undefined)
          return <span className="text-sm text-muted-foreground">—</span>;
        const kb = bytes / 1024;
        const mb = kb / 1024;
        return (
          <span className="text-sm text-body">
            {mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(0)} KB`}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-sm text-body">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1">
            {s.downloadUrl && (
              <a href={s.downloadUrl} target="_blank" rel="noreferrer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Button
              onClick={() => handleDeleteSupplement(s.id)}
              variant="ghost"
              size="sm"
              disabled={supplementToDelete?.id === s.id}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return {
    supplementColumns,
    supplementToDelete,
    setSupplementToDelete,
    handleDeleteSupplement,
  };
}
