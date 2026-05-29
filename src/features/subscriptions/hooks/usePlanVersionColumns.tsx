import { ColumnDef } from '@tanstack/react-table';
import { formatDate, formattedAmount } from '@src/shared/utils';
import { Badge } from '@src/shared/components/ui/badge';
import { type SubscriptionPlanVersion } from '../types';

export const usePlanVersionColumns = (): {
  columns: ColumnDef<SubscriptionPlanVersion>[];
} => {
  const columns: ColumnDef<SubscriptionPlanVersion>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Version Date',
      cell: ({ row }) => (
        <span className="text-sm text-ink">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-ink">
          {formattedAmount(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'billingCycle',
      header: 'Billing Cycle',
      cell: ({ row }) => (
        <Badge
          variant={row.original.billingCycle === 'YEARLY' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {row.original.billingCycle.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'effectiveFrom',
      header: 'Effective From',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.effectiveFrom)}
        </span>
      ),
    },
    {
      accessorKey: 'effectiveTo',
      header: 'Effective To',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.effectiveTo ? formatDate(row.original.effectiveTo) : '—'}
        </span>
      ),
    },
  ];

  return { columns };
};
