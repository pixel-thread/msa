"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@src/shared/components/data-table";
import { Input } from "@src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import {
  useConsentRecords,
  useDeleteConsentReceipt,
  useConsentColumns,
} from "../hooks";
import { ConsentDetailDialog } from "../components/consent-detail-dialog";
import { EditConsentDialog } from "../components/edit-consent-dialog";
import { DeleteConsentDialog } from "../components/delete-consent-dialog";
import { ConsentReportCards } from "../components/consent-report-cards";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { ConsentPurpose, ConsentStatus } from "@prisma/client";
import type { ConsentRecord } from "../types/consent.types";

export default function ConsentAdminPage() {
  const [page, setPage] = useState(1);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [detailRecord, setDetailRecord] = useState<ConsentRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<ConsentRecord | null>(
    null,
  );
  const [deletingRecord, setDeletingRecord] = useState<ConsentRecord | null>(
    null,
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Consent Management
          </h1>
          <p className="mt-1 text-base text-body">
            View, manage, and track member consent records across all purposes
          </p>
        </div>
      </div>

      <ConsentReportCards />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={purposeFilter}
            onValueChange={(value) => {
              setPurposeFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Purposes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {Object.values(ConsentPurpose).map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={ConsentStatus.GRANTED}>Granted</SelectItem>
              <SelectItem value={ConsentStatus.WITHDRAWN}>Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          loading={isLoading}
          data={records as unknown as ConsentRecord[]}
          columns={columns}
        />

        <div className="mt-4">
          <DataTablePagination meta={meta} onPageChange={setPage} label="records" />
        </div>
      </div>

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
