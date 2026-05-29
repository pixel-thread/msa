'use client';

import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import type { TrainingCertificateItem } from '../../types';

export function useTrainingCertificatesColumns(options: {
  certificates: TrainingCertificateItem[];
}) {
  const { certificates } = options;

  const [certificateToDelete, setCertificateToDelete] = useState<{
    id: string;
    userId: string;
    userName: string;
  } | null>(null);

  const handleDeleteCertificate = (certificateId: string) => {
    const cert = certificates?.find((c) => c.id === certificateId);
    setCertificateToDelete(
      cert
        ? { id: cert.id, userId: cert.userId, userName: cert.user.name }
        : { id: certificateId, userId: '', userName: 'this certificate' },
    );
  };

  const certificateColumns: ColumnDef<TrainingCertificateItem>[] = [
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
      accessorKey: 'certificateNumber',
      header: 'Cert. #',
      cell: ({ row }) => (
        <span className="text-sm text-body">{row.original.certificateNumber || '—'}</span>
      ),
    },
    {
      accessorKey: 'issuedAt',
      header: 'Issued',
      cell: ({ row }) => (
        <span className="text-sm text-body">{formatDate(row.original.issuedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1">
            <a href={c.certificateUrl} target="_blank" rel="noreferrer">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              >
                <Download className="h-4 w-4" />
              </Button>
            </a>
            <Button
              onClick={() => handleDeleteCertificate(c.id)}
              variant="ghost"
              size="sm"
              disabled={certificateToDelete?.id === c.id}
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
    certificateColumns,
    certificateToDelete,
    setCertificateToDelete,
    handleDeleteCertificate,
  };
}
