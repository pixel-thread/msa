'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Badge } from '@src/shared/components/ui/badge';
import { ConsentStatus } from '@prisma/client';
import type { ConsentRecord } from '../types/consent.types';

interface ConsentDetailDialogProps {
  record: ConsentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsentDetailDialog({ record, open, onOpenChange }: ConsentDetailDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Consent Receipt Detail</DialogTitle>
          <DialogDescription>Full details of the consent receipt</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Member</p>
              <p className="text-sm text-ink mt-1">{record.user?.name || 'Unknown'}</p>
              {record.user?.email && <p className="text-xs text-body">{record.user.email}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">User ID</p>
              <p className="text-sm text-ink mt-1 font-mono">{record.userId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-ink mt-1">{record.purpose}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Status</p>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    record.status === ConsentStatus.GRANTED
                      ? 'bg-[#ECFDF3] text-[#067647] border-[#ABEFC6]'
                      : 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
                  }
                >
                  {record.status === ConsentStatus.GRANTED ? 'Granted' : 'Withdrawn'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Channel</p>
              <p className="text-sm text-ink mt-1 capitalize">{record.channel}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">Date</p>
              <p className="text-sm text-ink mt-1">
                {new Date(record.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">IP Address</p>
              <p className="text-sm text-ink mt-1 font-mono">{record.ipAddress || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-body uppercase tracking-wider">User Agent</p>
              <p className="text-xs text-ink mt-1 break-words">{record.userAgent || '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-body uppercase tracking-wider">Receipt ID</p>
            <p className="text-sm text-ink mt-1 font-mono">{record.id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
