"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayments } from "@src/features/payments/hooks/usePayments";
import { PaymentsTable, PaymentFilters, RecordPaymentDialog } from "@src/features/payments/components";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { Button } from "@src/shared/components/ui/button";
import { Plus, Receipt } from "lucide-react";

export default function AllPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  const { payments, meta, isLoading } = usePayments({
    page: currentPage,
    ...filters,
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/payments?${params.toString()}`);
  };

  const handleFilterChange = (newFilters: Record<string, string | undefined>) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    params.set("page", "1");
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/payments?${params.toString()}`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            All Payments
          </h1>
          <p className="mt-1 text-base text-body">
            View and manage all payment transactions
          </p>
        </div>
        <Button onClick={() => setRecordDialogOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-4">
        <PaymentFilters onFilterChange={handleFilterChange} />
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Transactions ({meta?.total || 0})
            </h2>
          </div>
          <PaymentsTable payments={payments} isLoading={isLoading} />
        </div>
      </div>

      <DataTablePagination
        meta={meta}
        onPageChange={handlePageChange}
        label="payments"
      />

      <RecordPaymentDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
      />
    </>
  );
}
