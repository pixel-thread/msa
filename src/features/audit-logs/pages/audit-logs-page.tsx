'use client';

import { useState, useCallback } from 'react';
import { useUrlFilters } from '@src/shared/hooks';

import { DataTable } from '@src/shared/components/data-table';
import { SectionHeader } from '@src/shared/components/section-header';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Input } from '@src/shared/components/ui/input';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useAuditLogs } from '@src/features/audit-logs/hooks/useAuditLogs';
import { useAuditLogColumns } from '@src/features/audit-logs/hooks/useAuditLogColumns';
import { AuditLogDetailsDialog } from '@src/features/audit-logs/components/audit-log-details-dialog';
import type { AuditLogEntry } from '@src/features/audit-logs/types';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { FilterIcon } from 'lucide-react';

const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'CONSENT_GRANT',
  'CONSENT_REVOKE',
  'DSAR_SUBMIT',
  'DSAR_RESPOND',
  'PAYMENT_RECORD',
  'SUBSCRIPTION_CHANGE',
  'ANONYMIZE',
  'ROLE_CHANGE',
  'MEETING_ASSIGN',
  'MEETING_RSVP',
  'PAYMENT_CREATED',
  'PAYMENT_COMPLETED',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'PAYMENT_VERIFIED',
  'PAYMENT_WAIVED',
  'WEBHOOK_RECEIVED',
  'REPORT_EXPORTED',
  'ANNOUNCEMENT_CREATE',
  'ANNOUNCEMENT_PUBLISH',
  'ANNOUNCEMENT_DELETE',
  'ANNOUNCEMENT_READ',
  'TRAINING_MODULE_CREATE',
  'TRAINING_MODULE_UPDATE',
  'TRAINING_COMPLETE',
  'TRAINING_ASSIGN',
  'TRAINING_UNASSIGN',
  'COMPLAINT_CREATE',
  'COMPLAINT_UPDATE',
] as const;

const RESOURCE_TYPES = [
  'User',
  'Association',
  'Member',
  'Meeting',
  'AgendaItem',
  'Attendee',
  'Announcement',
  'AnnouncementReadReceipt',
  'TrainingModule',
  'TrainingCompletion',
  'Payment',
  'Subscription',
  'Complaint',
  'AuditLog',
] as const;

export default function AuditLogsPage() {
  const { filters, page, setPage, setFilters } = useUrlFilters({
    basePath: '/audit-logs',
  });

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const actionFilter = filters.action ?? '';
  const resourceFilter = filters.resourceType ?? '';
  const fromDateFilter = filters.fromDate ?? '';
  const toDateFilter = filters.toDate ?? '';

  const {
    logs: auditLogs,
    meta: pagination,
    isLoading,
  } = useAuditLogs({
    page,
    action: actionFilter && actionFilter !== 'all' ? actionFilter : undefined,
    resourceType: resourceFilter && resourceFilter !== 'all' ? resourceFilter : undefined,
    fromDate: fromDateFilter || undefined,
    toDate: toDateFilter || undefined,
  });

  const handleViewDetails = useCallback((entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  const { columns } = useAuditLogColumns({ onViewDetails: handleViewDetails });

  return (
    <>
      <SectionHeader
        title="Audit Logs"
        description="View activity logs and audit trail"
      />

      <div className="flex flex-cols md:flex-row gap-4">
        <Card className=" w-full border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className=" w-full border-hairline bg-surface-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Last 30 Days
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {pagination?.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className=" w-full border-hairline bg-surface-card">
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

      <DataTableFilters
        fields={[
          {
            type: 'select',
            id: 'action',
            label: 'Action',
            options: AUDIT_ACTIONS.map((a) => ({
              value: a,
              label: a.replace(/_/g, ' '),
            })),
          },
          {
            type: 'select',
            id: 'resourceType',
            label: 'Resource',
            options: RESOURCE_TYPES.map((r) => ({
              value: r,
              label: r,
            })),
          },
        ]}
        defaultValues={filters}
        onFilterChange={(f) => setFilters(f)}
      />

      <DataTable loading={isLoading} data={auditLogs} columns={columns} />

      <DataTablePagination meta={pagination} onPageChange={setPage} label="audit logs" />

      <AuditLogDetailsDialog
        entry={selectedEntry}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
