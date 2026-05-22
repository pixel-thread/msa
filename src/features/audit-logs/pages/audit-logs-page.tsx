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
import { FilterIcon, ChevronLeft, ChevronRight } from "lucide-react";

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last 30 Days
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-hairline bg-surface-card">
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
        <p className="text-sm text-muted-foreground">
          Page {pagination?.page} of {pagination?.totalPages} (
          {pagination?.total} total)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination?.page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 rounded-full border-hairline"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination?.hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 rounded-full border-hairline"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <AuditLogDetailsDialog
        entry={selectedEntry}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
