"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Separator } from "@src/shared/components/ui/separator";
import { formattedAmount } from "@src/shared/utils";
import { DataTable } from "@src/shared/components/data-table";
import {
  DataTableFilters,
} from "@src/shared/components/data-table-filters";
import { useSubscriptionPaymentColumns } from "@src/features/subscriptions/hooks/useSubscriptionPaymentColumns";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { CreditCard, Clock, Receipt, AlertCircle } from "lucide-react";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const { data, isLoading } = useQuery({
    queryKey: ["payment-history", currentPage],
    queryFn: () =>
      http.get<PaymentHistoryResponse>(
        `/payments/history?page=${currentPage}&pageSize=20`,
      ),
  });

  const transactions = data?.data?.transactions ?? [];
  const summary = data?.data?.summary;
  const meta = data?.meta as PaginationMeta | undefined;

  const { columns } = useSubscriptionPaymentColumns();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/subscriptions/my?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading payment history...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Payment History
          </h1>
          <p className="mt-1 text-base text-body">
            View your payment transactions and contribution history
          </p>
        </div>
      </div>

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
                    {formattedAmount(summary.totalPending)}
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
                    {formattedAmount(summary.totalDues)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className=" border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-base text-body">No payment history found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your payment transactions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <DataTableFilters
                fields={[
                  {
                    type: "search",
                    id: "search",
                    placeholder: "Search transactions...",
                  },
                ]}
                onFilterChange={() => {}}
              />

              <DataTable
                columns={columns}
                data={transactions}
                loading={false}
              />

              <Separator className="bg-hairline" />

              <DataTablePagination
                meta={meta}
                onPageChange={handlePageChange}
                label="transactions"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
