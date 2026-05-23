"use client";

import { useState, useCallback } from "react";

import { DataTable } from "@src/shared/components/data-table";
import { Card, CardContent } from "@src/shared/components/ui/card";
import { Input } from "@src/shared/components/ui/input";
import { Button } from "@src/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { useAuditLogs } from "@src/features/audit-logs/hooks/useAuditLogs";
import { useAuditLogColumns } from "@src/features/audit-logs/hooks/useAuditLogColumns";
import { AuditLogDetailsDialog } from "@src/features/audit-logs/components/audit-log-details-dialog";
import type { AuditLogEntry } from "@src/features/audit-logs/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import { FilterIcon } from "lucide-react";

const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "CONSENT_GRANT",
  "CONSENT_REVOKE",
  "DSAR_SUBMIT",
  "DSAR_RESPOND",
  "PAYMENT_RECORD",
  "SUBSCRIPTION_CHANGE",
  "ANONYMIZE",
  "ROLE_CHANGE",
  "MEETING_ASSIGN",
  "MEETING_RSVP",
  "PAYMENT_CREATED",
  "PAYMENT_COMPLETED",
  "PAYMENT_FAILED",
  "PAYMENT_REFUNDED",
  "PAYMENT_VERIFIED",
  "PAYMENT_WAIVED",
  "WEBHOOK_RECEIVED",
  "REPORT_EXPORTED",
  "ANNOUNCEMENT_CREATE",
  "ANNOUNCEMENT_PUBLISH",
  "ANNOUNCEMENT_DELETE",
  "ANNOUNCEMENT_READ",
  "TRAINING_MODULE_CREATE",
  "TRAINING_MODULE_UPDATE",
  "TRAINING_COMPLETE",
  "TRAINING_ASSIGN",
  "TRAINING_UNASSIGN",
  "COMPLAINT_CREATE",
  "COMPLAINT_UPDATE",
] as const;

const RESOURCE_TYPES = [
  "User",
  "Association",
  "Member",
  "Meeting",
  "AgendaItem",
  "Attendee",
  "Announcement",
  "AnnouncementReadReceipt",
  "TrainingModule",
  "TrainingCompletion",
  "Payment",
  "Subscription",
  "Complaint",
  "AuditLog",
] as const;

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filterAction = action && action !== "all" ? action : undefined;
  const filterResource =
    resourceType && resourceType !== "all" ? resourceType : undefined;

  const {
    logs,
    meta: pagination,
    isLoading,
    refetch,
  } = useAuditLogs({
    page,
    action: filterAction,
    resourceType: filterResource,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const getPageNumbers = (meta: { page: number; totalPages: number }) => {
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

  const handleViewDetails = useCallback((entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  const { columns } = useAuditLogColumns({ onViewDetails: handleViewDetails });

  const handleFilter = () => {
    setPage(1);
    refetch();
  };

  const handleReset = () => {
    setAction("");
    setResourceType("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Audit Logs
          </h1>
          <p className="mt-1 text-base text-body">
            View activity logs and audit trail
          </p>
        </div>
      </div>

      <div className="flex flex-cols md:flex-row gap-4 ">
        <Card className="rounded-xl w-full border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl w-full border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last 30 Days
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl w-full border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last 7 Days
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-hairline bg-surface-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Action
              </p>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-44 h-10 rounded-lg border-hairline">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {AUDIT_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Resource
              </p>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger className="w-40 h-10 rounded-lg border-hairline">
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  {RESOURCE_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">From</p>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40 h-10 rounded-lg border-hairline"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">To</p>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40 h-10 rounded-lg border-hairline"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleFilter}
                className="h-10 rounded-full border-hairline bg-canvas px-4 text-sm font-medium text-ink hover:bg-surface-strong"
              >
                <FilterIcon className="mr-1.5 h-4 w-4" />
                Apply
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-10 rounded-full px-4 text-sm text-muted-foreground"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable loading={isLoading} data={logs} columns={columns} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-body">
          Showing{" "}
          <span className="font-medium text-body-strong">
            {pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-body-strong">
            {pagination
              ? Math.min(pagination.page * pagination.pageSize, pagination.total)
              : 0}
          </span>{" "}
          of{" "}
          <span className="font-medium text-body-strong">
            {pagination?.total.toLocaleString()}
          </span>{" "}
          audit logs
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={
                  !pagination || pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pagination &&
              getPageNumbers(pagination).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={pagination.page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

            {pagination &&
              pagination.totalPages > 5 &&
              pagination.page < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => p + 1)}
                className={
                  !pagination || pagination.page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <AuditLogDetailsDialog
        entry={selectedEntry}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
