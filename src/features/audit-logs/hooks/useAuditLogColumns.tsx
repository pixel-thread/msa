import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { formatDate } from '@src/shared/utils';
import type { AuditLogEntry } from '../types';

function formatActionName(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatResourceId(id: string | null): string {
  if (!id) return '—';
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

const actionBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
  LOGIN: 'outline',
  LOGOUT: 'outline',
};

function getActionBadgeVariant(
  action: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  for (const [key, variant] of Object.entries(actionBadgeVariants)) {
    if (action.startsWith(key)) return variant;
  }
  return 'outline';
}

interface UseAuditLogColumnsOptions {
  onViewDetails?: (entry: AuditLogEntry) => void;
}

export function useAuditLogColumns({ onViewDetails }: UseAuditLogColumnsOptions = {}) {
  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant={getActionBadgeVariant(row.original.action)}>
          {formatActionName(row.original.action)}
        </Badge>
      ),
    },
    {
      accessorKey: 'resourceType',
      header: 'Resource',
      cell: ({ row }) => (
        <span className="text-sm capitalize">{row.original.resourceType.toLowerCase()}</span>
      ),
    },
    {
      accessorKey: 'resourceId',
      header: 'Resource ID',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {formatResourceId(row.original.resourceId)}
        </span>
      ),
    },
    {
      accessorKey: 'actorName',
      header: 'Actor',
      cell: ({ row }) => <span className="text-sm">{row.original.actorName || 'System'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: ({ row }) => {
        const hasDetails = row.original.oldValues || row.original.newValues;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={!hasDetails}
            onClick={() => onViewDetails?.(row.original)}
          >
            {hasDetails ? 'View' : '—'}
          </Button>
        );
      },
    },
  ];

  return { columns };
}
