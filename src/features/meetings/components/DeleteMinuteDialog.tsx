'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteMinuteDialogProps {
  minute: { id: string; agendaPoint: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteMinuteDialog({
  minute,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteMinuteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Minute</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete the minute for <strong>{minute?.agendaPoint}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Minute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
