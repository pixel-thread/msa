'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { ProviderResponse } from '../types';
import { TestPaymentButton } from '../components/test-payment-button';

interface UsePaymentProviderColumnsOptions {
  onEdit: (providerId: string) => void;
  onViewDetail: (providerId: string) => void;
  onDelete: (providerId: string) => void;
  isDeleting: boolean;
}

export function usePaymentProviderColumns(options: UsePaymentProviderColumnsOptions) {
  const { onEdit, onViewDetail, onDelete, isDeleting } = options;

  const columns: ColumnDef<ProviderResponse>[] = [
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <button
          onClick={() => onViewDetail(row.original.id)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.original.provider}
        </button>
      ),
    },
    {
      accessorKey: 'keyId',
      header: 'Key ID',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.original.keyId.slice(0, 20)}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? 'default' : 'secondary'}
          className={row.original.isActive ? 'bg-green-600' : ''}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
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
        <div className="flex items-center gap-1">
          <TestPaymentButton providerId={row.original.id} providerType={row.original.provider} />
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
  return { columns };
}
