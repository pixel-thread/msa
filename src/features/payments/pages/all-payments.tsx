"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayments } from "@src/features/payments/hooks/usePayments";
import { DataTableFilters } from "@src/shared/components/data-table-filters";
import { RecordPaymentDialog } from "@src/features/payments/components";
import { DataTable } from "@src/shared/components/data-table";
import { usePaymentTransactionColumns } from "@src/features/payments/hooks/usePaymentTransactionColumns";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { Button } from "@src/shared/components/ui/button";
import { Plus, Receipt } from "lucide-react";

export default function AllPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    {},
  );

  const { payments, meta, isLoading } = usePayments({
    page: currentPage,
    ...filters,
  });

  const { columns } = usePaymentTransactionColumns();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/payments?${params.toString()}`);
  };

  const handleFilterChange = (
    newFilters: Record<string, string | undefined>,
  ) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    params.set("page", "1");
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`?${params.toString()}`);
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

      <DataTableFilters
        fields={[
          {
            type: "search",
            id: "search",
            placeholder: "Search member, reference, receipt...",
          },
          {
            type: "select",
            id: "status",
            label: "Status",
            options: [
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
              { value: "FAILED", label: "Failed" },
              { value: "REFUNDED", label: "Refunded" },
              { value: "WAIVED", label: "Waived" },
            ],
          },
          {
            type: "select",
            id: "method",
            label: "Method",
            options: [
              { value: "CASH", label: "Cash" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "UPI", label: "UPI" },
              { value: "CHEQUE", label: "Cheque" },
              { value: "ONLINE", label: "Online" },
            ],
          },
          {
            type: "select",
            id: "gateway",
            label: "Gateway",
            options: [
              { value: "RAZORPAY", label: "Razorpay" },
              { value: "MANUAL", label: "Manual" },
            ],
          },
        ]}
        onFilterChange={handleFilterChange}
      />

      <DataTable columns={columns} data={payments} loading={isLoading} />

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
