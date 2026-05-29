import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import { SubscriptionPlan } from '../types';
import { PlanNameCell } from '@src/features/subscriptions/components/cells/plan-name-cell';
import { PlanAmountCell } from '@src/features/subscriptions/components/cells/plan-amount-cell';
import { PlanBillingCell } from '@src/features/subscriptions/components/cells/plan-billing-cell';
import { PlanStatusCell } from '@src/features/subscriptions/components/cells/plan-status-cell';
import { PlanActionsCell } from '@src/features/subscriptions/components/cells/plan-actions-cell';
import { PlanDefaultCell } from '@src/features/subscriptions/components/cells/plan-default-cell';

interface UsePlanTableColumnsOptions {
  onStatusChange: (planId: string, isActive: boolean) => void;
  onDelete: (planId: string) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onSetDefault: (planId: string) => void;
}

export const usePlanTableColumns = ({
  onStatusChange,
  onDelete,
  onEdit,
  onSetDefault,
}: UsePlanTableColumnsOptions): { columns: ColumnDef<SubscriptionPlan>[] } => {
  const columns: ColumnDef<SubscriptionPlan>[] = [
    {
      accessorKey: 'isDefault',
      header: 'Default',
      cell: ({ row }) => <PlanDefaultCell plan={row.original} onSetDefault={onSetDefault} />,
    },
    {
      accessorKey: 'name',
      header: 'Plan',
      cell: ({ row }) => <PlanNameCell plan={row.original} />,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <PlanAmountCell plan={row.original} />,
    },
    {
      accessorKey: 'billingCycle',
      header: 'Billing Cycle',
      cell: ({ row }) => <PlanBillingCell plan={row.original} />,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <PlanStatusCell plan={row.original} onStatusChange={onStatusChange} />,
    },
    {
      accessorKey: 'effectiveFrom',
      header: 'Effective From',
      cell: ({ row }) => (
        <span className="text-right text-muted-foreground text-sm block ml-auto">
          {formatDate(row.original.activeVersion?.effectiveFrom ?? row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <PlanActionsCell plan={row.original} onDelete={onDelete} onEdit={onEdit} />
      ),
    },
  ];

  return { columns };
};
