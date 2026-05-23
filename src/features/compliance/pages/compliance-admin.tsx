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
  useComplianceChecks,
  useDeleteComplianceCheck,
  useComplianceColumns,
} from "../hooks";
import { ComplianceDetailDialog } from "../components/compliance-detail-dialog";
import { DeleteComplianceDialog } from "../components/delete-compliance-dialog";
import { TriggerChecksDialog } from "../components/trigger-checks-dialog";
import { ComplianceStatusCards } from "../components/compliance-status-cards";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import {
  ALL_CHECK_TYPES,
  ComplianceCheckStatusEnum,
} from "../validators/compliance";
import type { ComplianceRecord } from "../types/compliance.types";

export default function ComplianceAdminPage() {
  const [page, setPage] = useState(1);
  const [checkTypeFilter, setCheckTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailRecord, setDetailRecord] = useState<ComplianceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ComplianceRecord | null>(null);

  const { checks, meta, isLoading } = useComplianceChecks({
    page,
    limit: 10,
    checkType: checkTypeFilter || undefined,
    status: statusFilter || undefined,
  });

  const deleteComplianceCheck = useDeleteComplianceCheck();

  const { columns } = useComplianceColumns({
    onViewDetail: setDetailRecord,
    onDelete: setDeletingRecord,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      deleteComplianceCheck.mutate(deletingRecord.id, {
        onSuccess: () => setDeletingRecord(null),
      });
    }
  }, [deletingRecord, deleteComplianceCheck]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Compliance Management
          </h1>
          <p className="mt-1 text-base text-body">
            Monitor, run, and review compliance checks across your association
          </p>
        </div>
        <TriggerChecksDialog />
      </div>

      <ComplianceStatusCards />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-3">
          <Select
            value={checkTypeFilter}
            onValueChange={(value) => {
              setCheckTypeFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Check Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Check Types</SelectItem>
              {ALL_CHECK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
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
              {ComplianceCheckStatusEnum.options.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          loading={isLoading}
          data={checks as unknown as ComplianceRecord[]}
          columns={columns}
        />

        <div className="mt-4">
          <DataTablePagination meta={meta} onPageChange={setPage} label="checks" />
        </div>
      </div>

      <ComplianceDetailDialog
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(open) => {
          if (!open) setDetailRecord(null);
        }}
      />

      <DeleteComplianceDialog
        open={!!deletingRecord}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteComplianceCheck.isPending}
      />
    </>
  );
}
