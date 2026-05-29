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
import { useAssignDsarTicket } from '../hooks';
import type { DsarTicketRecord } from '../types';
import { MemberCombobox } from '@src/shared/components/members/member-combobox';

interface DsarAssignDialogProps {
  record: DsarTicketRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DsarAssignDialog({ record, open, onOpenChange }: DsarAssignDialogProps) {
  const [selectedAdminId, setSelectedAdminId] = useState('');

  const assignMutation = useAssignDsarTicket();

  const handleSubmit = () => {
    if (!record || !selectedAdminId) return;

    assignMutation.mutate(
      { id: record.id, assignedToId: selectedAdminId },
      {
        onSuccess: () => {
          setSelectedAdminId('');
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = () => {
    setSelectedAdminId('');
    onOpenChange(false);
  };

  if (!record) return null;

  const currentAssigneeId = record.assignedTo?.id || '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign DSAR Ticket</DialogTitle>
          <DialogDescription>
            {record.ticketNumber} — Choose an administrator to handle this request
          </DialogDescription>
        </DialogHeader>

        <MemberCombobox
          value={selectedAdminId || currentAssigneeId}
          onValueChange={(id) => setSelectedAdminId(id)}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={assignMutation.isPending || !selectedAdminId}>
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
