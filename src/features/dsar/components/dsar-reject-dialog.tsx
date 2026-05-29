'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Label } from '@src/shared/components/ui/label';
import { Textarea } from '@src/shared/components/ui/textarea';
import { useRejectDsarTicket } from '../hooks';
import type { DsarTicketRecord } from '../types';

interface DsarRejectDialogProps {
  record: DsarTicketRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DsarRejectDialog({ record, open, onOpenChange }: DsarRejectDialogProps) {
  const [reason, setReason] = useState('');

  const rejectMutation = useRejectDsarTicket();

  const handleSubmit = () => {
    if (!record || !reason.trim()) return;

    rejectMutation.mutate(
      { id: record.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject DSAR Ticket</DialogTitle>
          <DialogDescription>
            {record.ticketNumber} — Provide a reason for rejecting this request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Reason for Rejection</Label>
          <Textarea
            placeholder="Explain why this request is being rejected..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={rejectMutation.isPending || !reason.trim()}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
