'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUrlFilters } from '@src/shared/hooks';
import { DataTable } from '@src/shared/components/data-table';
import { Button } from '@src/shared/components/ui/button';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useLedgerEntries, type LedgerEntryResponse } from '../hooks/useLedgerEntries';
import { useLedgerEntriesColumns } from '../hooks/useLedgerEntriesColumns';
import { CreateEntryDialog } from '../components/create-entry-dialog';
import { ApproveEntryDialog } from '../components/approve-entry-dialog';
import { Plus } from 'lucide-react';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';

export default function LedgerEntriesPage() {
  const router = useRouter();
  const { page, setPage } = useUrlFilters({ basePath: '/ledger/entries' });

  const [createOpen, setCreateOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const { entries, meta, isLoading } = useLedgerEntries({
    page,
  });

  const handleViewDetails = useCallback(
    (entry: LedgerEntryResponse) => {
      router.push(`/ledger/entries/${entry.id}`);
    },
    [router],
  );

  const handleApprove = useCallback((entry: LedgerEntryResponse) => {
    setApproveTarget({ id: entry.id, description: entry.description });
  }, []);

  const { columns } = useLedgerEntriesColumns({
    onViewDetails: handleViewDetails,
    onApprove: handleApprove,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Ledger Entries
          </h1>
          <p className="mt-1 text-base text-body">View and manage all ledger transactions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Entry
        </Button>
      </div>

      <DataTableFilters
        fields={[
          {
            type: 'select',
            id: 'status',
            label: 'Status',
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ],
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={entries} columns={columns} />

      <DataTablePagination meta={meta} onPageChange={setPage} />

      <CreateEntryDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ApproveEntryDialog
        entryId={approveTarget?.id ?? null}
        entryDescription={approveTarget?.description ?? ''}
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
      />
    </>
  );
}
