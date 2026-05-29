'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Badge } from '@src/shared/components/ui/badge';
import type { ComplianceRecord } from '../types/compliance.types';

interface ComplianceDetailDialogProps {
  record: ComplianceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, string> = {
  PASSED: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
  FAILED: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
  WARNING: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
  SKIPPED: 'bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]',
};

export function ComplianceDetailDialog({
  record,
  open,
  onOpenChange,
}: ComplianceDetailDialogProps) {
  if (!record) return null;

  const details = record.details
    ? typeof record.details === 'object'
      ? record.details
      : { value: record.details }
    : null;

  const recommendations = record.recommendations
    ? Array.isArray(record.recommendations)
      ? record.recommendations
      : []
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compliance Check Detail</DialogTitle>
          <DialogDescription>{record.checkType.replace(/_/g, ' ')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Status</p>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${statusStyles[record.status] || ''}`}
                >
                  {record.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Score</p>
              <p className="text-sm text-ink mt-1 font-semibold">{record.score}%</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-body uppercase tracking-wider">Message</p>
            <p className="text-sm text-ink mt-1">{record.message}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-body uppercase tracking-wider">Check Date</p>
            <p className="text-sm text-ink mt-1">
              {new Date(record.checkedAt).toLocaleString('en-IN')}
            </p>
          </div>

          {details && Object.keys(details).length > 0 && (
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider mb-2">Details</p>
              <div className=" bg-muted p-3">
                <pre className="text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider mb-2">
                Recommendations
              </p>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-ink">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-body uppercase tracking-wider">Check ID</p>
            <p className="text-sm text-ink mt-1 font-mono">{record.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
