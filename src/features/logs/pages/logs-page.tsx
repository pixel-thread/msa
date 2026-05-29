'use client';

import { useState, useCallback } from 'react';
import { useUrlFilters } from '@src/shared/hooks';
import { DataTable } from '@src/shared/components/data-table';
import { SectionHeader } from '@src/shared/components/section-header';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useLogs } from '@src/features/logs/hooks/useLogs';
import { useLogColumns } from '@src/features/logs/hooks/useLogColumns';
import { LogDetailsDialog } from '@src/features/logs/components/log-details-dialog';
import { LOGS_FILTER_FIELDS } from '@src/features/logs/utils/constants/filters';
import type { LogEntry } from '@src/features/logs/types';

export default function LogsPage() {
  const { filters, page, setPage, setFilters } = useUrlFilters({
    basePath: '/logs',
  });

  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const levelFilter = filters.level ?? '';
  const searchFilter = filters.search ?? '';
  const sortByFilter = filters.sortBy ?? '';
  const dateFromFilter = filters.dateFrom ?? '';
  const dateToFilter = filters.dateTo ?? '';
  const backendFilter = filters.isBackend ?? '';

  const {
    logs,
    meta: pagination,
    isLoading,
  } = useLogs({
    page,
    level: levelFilter || undefined,
    search: searchFilter || undefined,
    sortBy: (sortByFilter as 'createdAt' | 'type' | 'message') || undefined,
    startDate: dateFromFilter || undefined,
    endDate: dateToFilter || undefined,
    isBackend: backendFilter ? backendFilter === 'true' : undefined,
  });

  const handleViewDetails = useCallback((entry: LogEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  const { columns } = useLogColumns({ onViewDetails: handleViewDetails });

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      setFilters(newFilters);
    },
    [setFilters],
  );

  return (
    <>
      <SectionHeader
        title="App Logs"
        description="View application logs, errors, and tracing information"
      />

      <DataTableFilters
        key={`filters-${searchFilter}-${levelFilter}-${sortByFilter}-${dateFromFilter}-${dateToFilter}-${backendFilter}`}
        fields={LOGS_FILTER_FIELDS}
        defaultValues={{
          search: searchFilter,
          level: levelFilter,
          sortBy: sortByFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter,
          isBackend: backendFilter,
        }}
        onFilterChange={handleFilterChange}
      />

      <DataTable loading={isLoading} data={logs} columns={columns} />

      <DataTablePagination meta={pagination} onPageChange={setPage} label="logs" />

      <LogDetailsDialog entry={selectedEntry} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
}
