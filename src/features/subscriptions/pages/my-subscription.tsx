'use client';

import { useUrlFilters } from '@src/shared/hooks';
import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { SectionHeader } from '@src/shared/components/section-header';
import { formattedAmount } from '@src/shared/utils';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useSubscriptionPaymentColumns } from '@src/features/subscriptions/hooks/useSubscriptionPaymentColumns';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { CreditCard, Clock, AlertCircle } from 'lucide-react';

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

interface PaymentHistoryResponse {
  transactions: PaymentTransaction[];
  summary: {
    totalPaid: number;
    totalPending: number;
    totalDues: number;
  };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function MySubscriptionPage() {
  const { page, setPage } = useUrlFilters({ basePath: '/subscriptions/my' });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-history', page],
    queryFn: () => http.get<PaymentHistoryResponse>(`/payments/history?page=${page}&pageSize=20`),
  });

  const transactions = data?.data?.transactions ?? [];
  const summary = data?.data?.summary;
  const meta = data?.meta as PaginationMeta | undefined;

  const { columns } = useSubscriptionPaymentColumns();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading payment history...</p>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Payment History"
        description="View your payment transactions and contribution history"
      />

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className=" border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formattedAmount(summary.totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className=" border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formattedAmount(summary.totalPending || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className=" border-hairline bg-surface-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Dues</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formattedAmount(summary.totalDues || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="p-4">
        <DataTableFilters
          fields={[
            {
              type: 'search',
              id: 'search',
              placeholder: 'Search transactions...',
            },
          ]}
          onFilterChange={() => {}}
        />

        <DataTable columns={columns} data={transactions} loading={false} />

        <DataTablePagination meta={meta} onPageChange={setPage} label="transactions" />
      </Card>
    </>
  );
}
