"use client";

import { useState, useCallback } from "react";
import { DataTable } from "@src/shared/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import {
  useDsarTickets,
  useDeleteDsarTicket,
  useDsarColumns,
} from "../hooks";
import { DsarDetailDialog } from "../components/dsar-detail-dialog";
import { DsarRespondDialog } from "../components/dsar-respond-dialog";
import { DsarRejectDialog } from "../components/dsar-reject-dialog";
import { DsarAssignDialog } from "../components/dsar-assign-dialog";
import { DsarDeleteDialog } from "../components/dsar-delete-dialog";
import { DsarSlaCards } from "../components/dsar-sla-cards";
import { ConsentPagination } from "@src/features/consent/components/consent-pagination";
import type { DsarTicketRecord } from "../types";

const requestTypes = ["ACCESS", "DELETION", "PORTABILITY", "RECTIFICATION", "RESTRICTION", "OBJECTION"];
const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"];

export default function DsarAdminPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");

  const [detailRecord, setDetailRecord] = useState<DsarTicketRecord | null>(null);
  const [respondRecord, setRespondRecord] = useState<DsarTicketRecord | null>(null);
  const [rejectRecord, setRejectRecord] = useState<DsarTicketRecord | null>(null);
  const [assignRecord, setAssignRecord] = useState<DsarTicketRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DsarTicketRecord | null>(null);

  const { tickets, meta, isLoading } = useDsarTickets({
    page,
    limit: 10,
    status: statusFilter || undefined,
    requestType: requestTypeFilter || undefined,
  });

  const deleteDsarTicket = useDeleteDsarTicket();

  const { columns } = useDsarColumns({
    onViewDetail: setDetailRecord,
    onRespond: (record) => {
      if (record.status === "REJECTED" || record.status === "COMPLETED") {
        setDetailRecord(record);
      } else {
        setRespondRecord(record);
      }
    },
    onDelete: setDeletingRecord,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deletingRecord) {
      deleteDsarTicket.mutate(deletingRecord.id, {
        onSuccess: () => setDeletingRecord(null),
      });
    }
  }, [deletingRecord, deleteDsarTicket]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            DSAR Management
          </h1>
          <p className="mt-1 text-base text-body">
            Manage data subject access requests across your association
          </p>
        </div>
      </div>

      <DsarSlaCards />

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-3">
          <Select
            value={requestTypeFilter}
            onValueChange={(value) => {
              setRequestTypeFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {requestTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
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
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "IN_PROGRESS"
                    ? "In Progress"
                    : s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          loading={isLoading}
          data={tickets as unknown as DsarTicketRecord[]}
          columns={columns}
        />

        {meta && (
          <div className="mt-4">
            <ConsentPagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      <DsarDetailDialog
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(open) => {
          if (!open) setDetailRecord(null);
        }}
      />

      <DsarRespondDialog
        record={respondRecord}
        open={!!respondRecord}
        onOpenChange={(open) => {
          if (!open) setRespondRecord(null);
        }}
      />

      <DsarRejectDialog
        record={rejectRecord}
        open={!!rejectRecord}
        onOpenChange={(open) => {
          if (!open) setRejectRecord(null);
        }}
      />

      <DsarAssignDialog
        record={assignRecord}
        open={!!assignRecord}
        onOpenChange={(open) => {
          if (!open) setAssignRecord(null);
        }}
      />

      <DsarDeleteDialog
        open={!!deletingRecord}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteDsarTicket.isPending}
      />
    </>
  );
}
