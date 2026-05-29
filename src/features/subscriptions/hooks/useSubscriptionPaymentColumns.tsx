'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { formatDate, formattedAmount } from '@src/shared/utils';
import { getMonthName } from '@src/shared/utils/helper/get-month-name';
import { getMethodBadge } from '@src/shared/utils/helper/get-method-badge';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';

interface PaymentAllocation {
  id: string;
  allocatedAmount: number;
  contributionPeriod: {
    year: number;
    month: number;
    expectedAmount: number;
    status: string;
  };
}

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  method: string | null;
  referenceNumber: string | null;
  receiptNumber: string | null;
  notes: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  allocations: PaymentAllocation[];
}

export function useSubscriptionPaymentColumns() {
  const columns: ColumnDef<PaymentTransaction>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatDate(row.original.paymentDate)}</span>
          {row.original.notes && (
            <span className="text-xs text-muted-foreground line-clamp-1">{row.original.notes}</span>
          )}
        </div>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => getMethodBadge(row.original.method),
    },
    {
      accessorKey: 'gateway',
      header: 'Gateway',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.gateway.toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'allocations',
      header: 'Allocations',
      cell: ({ row }) => {
        const allocations = row.original.allocations;
        return allocations.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {allocations.map((alloc) => (
              <Badge key={alloc.id} variant="secondary" className="text-xs">
                {getMonthName(alloc.contributionPeriod.month)} {alloc.contributionPeriod.year}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No allocations</span>
        );
      },
    },
    {
      id: 'reference',
      header: () => <span className="text-right">Reference</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground block text-right">
          {row.original.referenceNumber ||
            row.original.receiptNumber ||
            row.original.razorpayPaymentId ||
            '-'}
        </span>
      ),
    },
  ];
  return { columns };
}
