'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Badge } from '@src/shared/components/ui/badge';
import { useDsarTicketDetail } from '../hooks';
import type { DsarTicketRecord } from '../types';

interface DsarDetailDialogProps {
  record: DsarTicketRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
  IN_PROGRESS: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
  COMPLETED: 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]',
  REJECTED: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
};

const requestTypeLabels: Record<string, string> = {
  ACCESS: 'Access',
  DELETION: 'Deletion',
  PORTABILITY: 'Portability',
  RECTIFICATION: 'Rectification',
  RESTRICTION: 'Restriction',
  OBJECTION: 'Objection',
};

export function DsarDetailDialog({ record, open, onOpenChange }: DsarDetailDialogProps) {
  const [fetchId, setFetchId] = useState<string | null>(null);

  const { ticket, isLoading } = useDsarTicketDetail(fetchId);

  useEffect(() => {
    if (open && record) {
      setFetchId(record.id);
    } else if (!open) {
      setFetchId(null);
    }
  }, [open, record]);

  const detail = ticket || record;

  if (!detail) return null;

  const daysRemaining = detail.responseDeadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(detail.responseDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DSAR Ticket Detail</DialogTitle>
          <DialogDescription>
            {detail.ticketNumber} — {requestTypeLabels[detail.requestType] || detail.requestType}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !ticket ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-body">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${statusStyles[detail.status] || ''}`}
                  >
                    {detail.status === 'IN_PROGRESS'
                      ? 'In Progress'
                      : detail.status.charAt(0) + detail.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider">SLA</p>
                <p className="text-sm text-ink mt-1 font-semibold">
                  {daysRemaining !== null
                    ? daysRemaining === 0
                      ? 'Due today'
                      : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
                    : '-'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Member</p>
              <p className="text-sm text-ink mt-1">
                {detail.member?.name || 'Unknown'}
                {detail.member?.email && (
                  <span className="text-body ml-2">({detail.member.email})</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Assigned To</p>
              <p className="text-sm text-ink mt-1">{detail.assignedTo?.name || 'Not assigned'}</p>
            </div>

            {detail.description && (
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider">
                  Description
                </p>
                <p className="text-sm text-ink mt-1">{detail.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">
                Requested Data
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {detail.requestedData.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {detail.responses && detail.responses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider mb-2">
                  Responses
                </p>
                <div className="space-y-2">
                  {detail.responses.map((response) => (
                    <div key={response.id} className=" bg-muted p-3 text-sm">
                      <p className="font-medium text-ink">{response.responseType}</p>
                      <p className="text-body text-xs mt-1">
                        Delivered via {response.deliveryMethod}
                      </p>
                      {response.notes && <p className="text-body mt-1">{response.notes}</p>}
                      <p className="text-body text-xs mt-1">
                        {new Date(response.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.rejectedReason && (
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider">
                  Rejection Reason
                </p>
                <p className="text-sm text-ink mt-1">{detail.rejectedReason}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-body uppercase tracking-wider">Created</p>
                <p className="text-sm text-ink mt-1">
                  {new Date(detail.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              {detail.completedAt && (
                <div>
                  <p className="text-xs font-medium text-body uppercase tracking-wider">
                    Completed
                  </p>
                  <p className="text-sm text-ink mt-1">
                    {new Date(detail.completedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
