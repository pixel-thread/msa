"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DataTable } from "@src/shared/components/data-table";
import { Card, CardContent } from "@src/shared/components/ui/card";
import { Button } from "@src/shared/components/ui/button";
import {
  DataTableFilters,
} from "@src/shared/components/data-table-filters";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import {
  useLedgerEntries,
  type LedgerEntryResponse,
} from "../hooks/useLedgerEntries";
import { useApproveEntry } from "../hooks/useApproveEntry";
import { useLedgerEntriesColumns } from "../hooks/useLedgerEntriesColumns";
import { CreateEntryDialog } from "../components/create-entry-dialog";
import { ApproveEntryDialog } from "../components/approve-entry-dialog";
import { Plus } from "lucide-react";

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export default function LedgerEntriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") ?? "ALL";

  const [createOpen, setCreateOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const { entries, meta, isLoading } = useLedgerEntries({
    page: currentPage,
    pageSize: 20,
  });

  const pushParams = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const page = overrides.page ?? String(currentPage);
    params.set("page", page);
    const status =
      overrides.status !== undefined ? overrides.status : statusFilter;
    if (status && status !== "ALL") params.set("status", status);
    router.push(`/ledger/entries?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    pushParams({ page: String(page) });
  };

  const handleViewDetails = useCallback((entry: LedgerEntryResponse) => {
    router.push(`/ledger/entries/${entry.id}`);
  }, [router]);

  const handleApprove = useCallback((entry: LedgerEntryResponse) => {
    setApproveTarget({ id: entry.id, description: entry.description });
  }, []);

  const { columns } = useLedgerEntriesColumns({
    onViewDetails: handleViewDetails,
    onApprove: handleApprove,
  });

  const getPageNumbers = (meta: {
    page: number;
    totalPages: number;
  }) => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (meta.totalPages <= maxVisible) {
      for (let i = 1; i <= meta.totalPages; i++) {
        pages.push(i);
      }
    } else if (meta.page <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (meta.page >= meta.totalPages - 2) {
      for (let i = meta.totalPages - 4; i <= meta.totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = meta.page - 2; i <= meta.page + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Ledger Entries
          </h1>
          <p className="mt-1 text-base text-body">
            View and manage all ledger transactions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Entry
        </Button>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardContent className="p-4">
          <DataTableFilters
            fields={[
              {
                type: "select",
                id: "status",
                label: "Status",
                options: [
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                ],
              },
            ]}
            onFilterChange={() => {}}
          />
        </CardContent>
      </Card>

      <DataTable loading={isLoading} data={entries} columns={columns} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-body">
          Showing{" "}
          <span className="font-medium text-body-strong">
            {meta ? (meta.page - 1) * meta.pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-body-strong">
            {meta
              ? Math.min(
                  meta.page * meta.pageSize,
                  meta.total,
                )
              : 0}
          </span>{" "}
          of{" "}
          <span className="font-medium text-body-strong">
            {meta?.total.toLocaleString()}
          </span>{" "}
          entries
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={
                  !meta || meta.page <= 1
                   ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {meta &&
              getPageNumbers(meta).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={meta.page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

            {meta &&
              meta.totalPages > 5 &&
              meta.page < meta.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={
                  !meta || meta.page >= meta.totalPages
                   ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <CreateEntryDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ApproveEntryDialog
        entryId={approveTarget?.id ?? null}
        entryDescription={approveTarget?.description ?? ""}
        open={!!approveTarget}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
      />
    </>
  );
}
