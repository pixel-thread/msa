'use client';

import { useState, useCallback } from 'react';
import { DataTable } from '@src/shared/components/data-table';
import { SectionHeader } from '@src/shared/components/section-header';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useConsentRecords, useDeleteConsentReceipt, useConsentColumns } from '../hooks';
import { ConsentDetailDialog } from '../components/consent-detail-dialog';
import { EditConsentDialog } from '../components/edit-consent-dialog';
import { DeleteConsentDialog } from '../components/delete-consent-dialog';
import { ConsentReportCards } from '../components/consent-report-cards';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { ConsentPurpose, ConsentStatus } from '@prisma/client';
import type { ConsentRecord } from '../types/consent.types';

export default function ConsentAdminPage() {
  const [page, setPage] = useState(1);
  const [purposeFilter, setPurposeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailRecord, setDetailRecord] = useState<ConsentRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<ConsentRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ConsentRecord | null>(null);

  const { records, meta, isLoading } = useConsentRecords({
    page,
    pageSize: 10,
    purpose: purposeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const deleteConsentReceipt = useDeleteConsentReceipt();

  const { columns } = useConsentColumns({
    onViewDetail: setDetailRecord,
    onEdit: setEditingRecord,
    onDelete: setDeletingRecord,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      deleteConsentReceipt.mutate(deletingRecord.id, {
        onSuccess: () => setDeletingRecord(null),
      });
    }
  }, [deletingRecord, deleteConsentReceipt]);

  return (
    <>
      <SectionHeader
        title="Consent Management"
        description="View, manage, and track member consent records across all purposes"
      />

      <ConsentReportCards />

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search by name or email...',
          },
          {
            type: 'select',
            id: 'purpose',
            label: 'Purpose',
            options: Object.values(ConsentPurpose).map((p) => ({
              value: p,
              label: p.charAt(0) + p.slice(1).toLowerCase(),
            })),
          },
          {
            type: 'select',
            id: 'status',
            label: 'Status',
            options: [
              { value: ConsentStatus.GRANTED, label: 'Granted' },
              { value: ConsentStatus.WITHDRAWN, label: 'Withdrawn' },
            ],
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable
        loading={isLoading}
        data={records as unknown as ConsentRecord[]}
        columns={columns}
      />

      <DataTablePagination meta={meta} onPageChange={setPage} label="records" />

      <ConsentDetailDialog
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(open) => {
          if (!open) setDetailRecord(null);
        }}
      />

      <EditConsentDialog
        record={editingRecord}
        open={!!editingRecord}
        onOpenChange={(open) => {
          if (!open) setEditingRecord(null);
        }}
      />

      <DeleteConsentDialog
        open={!!deletingRecord}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteConsentReceipt.isPending}
      />
    </>
  );
}
