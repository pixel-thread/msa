"use client";

import { useState, useCallback } from "react";
import { useUrlFilters } from "@src/shared/hooks";
import { DataTable } from "@src/shared/components/data-table";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { DataTableFilters } from "@src/shared/components/data-table-filters";
import { useLogs } from "@src/features/logs/hooks/useLogs";
import { useLogColumns } from "@src/features/logs/hooks/useLogColumns";
import { LogDetailsDialog } from "@src/features/logs/components/log-details-dialog";
import type { LogEntry } from "@src/features/logs/types";

const LOG_LEVELS = [
  { value: "error", label: "Error" },
  { value: "warn", label: "Warn" },
  { value: "info", label: "Info" },
  { value: "debug", label: "Debug" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date" },
  { value: "type", label: "Level" },
  { value: "message", label: "Message" },
];

export default function LogsPage() {
  const { filters, page, setPage, setFilters } = useUrlFilters({
    basePath: "/logs",
  });

  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const levelFilter = filters.level ?? "";
  const searchFilter = filters.search ?? "";
  const sortByFilter = filters.sortBy ?? "";
  const dateFromFilter = filters.dateFrom ?? "";
  const dateToFilter = filters.dateTo ?? "";

  const {
    logs,
    meta: pagination,
    isLoading,
  } = useLogs({
    page,
    level: levelFilter || undefined,
    search: searchFilter || undefined,
    sortBy: (sortByFilter as "createdAt" | "type" | "message") || undefined,
    startDate: dateFromFilter || undefined,
    endDate: dateToFilter || undefined,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            App Logs
          </h1>
          <p className="mt-1 text-base text-body">
            View application logs, errors, and tracing information
          </p>
        </div>
      </div>

      <DataTableFilters
        key={`filters-${searchFilter}-${levelFilter}-${sortByFilter}-${dateFromFilter}-${dateToFilter}`}
        fields={[
          { type: "search", id: "search", placeholder: "Search message..." },
          {
            type: "select",
            id: "level",
            label: "Level",
            options: LOG_LEVELS,
          },
          {
            type: "daterange",
            id: "date",
            label: "Date",
          },
          {
            type: "select",
            id: "sortBy",
            label: "Sort by",
            options: SORT_OPTIONS,
          },
        ]}
        defaultValues={{
          search: searchFilter,
          level: levelFilter,
          sortBy: sortByFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter,
        }}
        onFilterChange={handleFilterChange}
      />

      <DataTable loading={isLoading} data={logs} columns={columns} />

      <DataTablePagination
        meta={pagination}
        onPageChange={setPage}
        label="logs"
      />

      <LogDetailsDialog
        entry={selectedEntry}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
