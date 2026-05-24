"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@src/shared/components/data-table";
import { DataTableFilters } from "@src/shared/components/data-table-filters";
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
import { useRouter, useSearchParams } from "next/navigation";

export default function ComplianceAdminPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1") || 1;
  const router = useRouter();

  const [checkTypeFilter, setCheckTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailRecord, setDetailRecord] = useState<ComplianceRecord | null>(
    null,
  );
  const [deletingRecord, setDeletingRecord] = useState<ComplianceRecord | null>(
    null,
  );

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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

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

      <DataTableFilters
        fields={[
          {
            type: "select",
            id: "checkType",
            label: "Check Type",
            options: ALL_CHECK_TYPES.map((t) => ({
              value: t,
              label: t.replace(/_/g, " "),
            })),
          },
          {
            type: "select",
            id: "status",
            label: "Status",
            options: ComplianceCheckStatusEnum.options.map((s) => ({
              value: s,
              label: s.charAt(0) + s.slice(1).toLowerCase(),
            })),
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable
        loading={isLoading}
        data={checks as unknown as ComplianceRecord[]}
        columns={columns}
      />

      <DataTablePagination
        meta={meta}
        onPageChange={handlePageChange}
        label="checks"
      />

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
