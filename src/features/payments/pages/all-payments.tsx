'use client';

import { useState } from 'react';
import { usePayments } from '@src/features/payments/hooks/usePayments';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { RecordPaymentDialog } from '@src/features/payments/components';
import { DataTable } from '@src/shared/components/data-table';
import { usePaymentTransactionColumns } from '@src/features/payments/hooks/usePaymentTransactionColumns';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useUrlFilters } from '@src/shared/hooks';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Plus } from 'lucide-react';

export default function AllPaymentsPage() {
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const { filters, page, setPage, setFilters } = useUrlFilters({
    basePath: '/payments',
  });

  const { payments, meta, isLoading } = usePayments({
    page,
    ...filters,
  });

  const { columns } = usePaymentTransactionColumns();

  return (
    <>
      <SectionHeader
        title="All Payments"
        description="View and manage all payment transactions"
      >
        <Button onClick={() => setRecordDialogOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </SectionHeader>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search member, reference, receipt...',
          },
          {
            type: 'select',
            id: 'status',
            label: 'Status',
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'REFUNDED', label: 'Refunded' },
              { value: 'WAIVED', label: 'Waived' },
            ],
          },
          {
            type: 'select',
            id: 'method',
            label: 'Method',
            options: [
              { value: 'CASH', label: 'Cash' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'UPI', label: 'UPI' },
              { value: 'CHEQUE', label: 'Cheque' },
              { value: 'ONLINE', label: 'Online' },
            ],
          },
          {
            type: 'select',
            id: 'gateway',
            label: 'Gateway',
            options: [
              { value: 'RAZORPAY', label: 'Razorpay' },
              { value: 'MANUAL', label: 'Manual' },
            ],
          },
        ]}
        onFilterChange={setFilters}
      />

      <DataTable columns={columns} data={payments} loading={isLoading} />

      <DataTablePagination meta={meta} onPageChange={setPage} label="payments" />

      <RecordPaymentDialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen} />
    </>
  );
}
