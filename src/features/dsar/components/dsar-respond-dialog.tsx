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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Button } from '@src/shared/components/ui/button';
import { Label } from '@src/shared/components/ui/label';
import { Input } from '@src/shared/components/ui/input';
import { Textarea } from '@src/shared/components/ui/textarea';
import { useRespondToDsarTicket } from '../hooks';
import type { DsarTicketRecord } from '../types';

interface DsarRespondDialogProps {
  record: DsarTicketRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DsarRespondDialog({ record, open, onOpenChange }: DsarRespondDialogProps) {
  const [status, setStatus] = useState('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [responseType, setResponseType] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('secure_download');

  const respondMutation = useRespondToDsarTicket();

  const handleSubmit = () => {
    if (!record) return;

    respondMutation.mutate(
      {
        id: record.id,
        data: {
          status,
          notes: notes || undefined,
          responseType: responseType || undefined,
          storageKey: storageKey || undefined,
          deliveryMethod,
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setStatus('IN_PROGRESS');
    setNotes('');
    setResponseType('');
    setStorageKey('');
    setDeliveryMethod('secure_download');
    onOpenChange(false);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to DSAR Ticket</DialogTitle>
          <DialogDescription>
            {record.ticketNumber} — Process this data subject access request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Response Type</Label>
            <Input
              placeholder="e.g. JSON, PDF, CSV"
              value={responseType}
              onChange={(e) => setResponseType(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Storage Key</Label>
            <Input
              placeholder="Key for secure storage"
              value={storageKey}
              onChange={(e) => setStorageKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secure_download">Secure Download</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Internal notes or member-facing message"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={respondMutation.isPending}>
            {respondMutation.isPending ? 'Submitting...' : 'Submit Response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
