import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { ComplianceActionsCell } from '../components/cells/compliance-actions-cell';
import type { ComplianceRecord } from '../types/compliance.types';

interface UseComplianceColumnsOptions {
  onViewDetail: (record: ComplianceRecord) => void;
  onDelete: (record: ComplianceRecord) => void;
}

const statusStyles: Record<string, string> = {
  PASSED: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
  FAILED: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
  WARNING: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
  SKIPPED: 'bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]',
};

const checkTypeLabels: Record<string, string> = {
  CONSENT_COVERAGE: 'Consent Coverage',
  DSAR_SLA_COMPLIANCE: 'DSAR SLA',
  DATA_RETENTION: 'Data Retention',
  PII_ENCRYPTION: 'PII Encryption',
  SUBSCRIPTION_EXPIRY: 'Subscription Expiry',
  MEMBER_DATA_COMPLETENESS: 'Member Data',
  PAYMENT_RECONCILIATION: 'Payment Recon',
  AUDIT_LOG_INTEGRITY: 'Audit Log Integrity',
};

export function useComplianceColumns({ onViewDetail, onDelete }: UseComplianceColumnsOptions) {
  const columns: ColumnDef<ComplianceRecord>[] = [
    {
      accessorKey: 'checkType',
      header: 'Check Type',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-ink">
          {checkTypeLabels[row.original.checkType] || row.original.checkType}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${statusStyles[row.original.status] || ''}`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.score}%</span>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <span className="text-sm text-body line-clamp-1 max-w-[300px]">{row.original.message}</span>
      ),
    },
    {
      accessorKey: 'checkedAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-body">
          {new Date(row.original.checkedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ComplianceActionsCell
          record={row.original}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return { columns };
}
