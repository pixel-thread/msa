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
import { useApproveEntry } from '../hooks/useApproveEntry';

interface ApproveEntryDialogProps {
  entryId: string | null;
  entryDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApproveEntryDialog({
  entryId,
  entryDescription,
  open,
  onOpenChange,
}: ApproveEntryDialogProps) {
  const approveEntry = useApproveEntry();

  const handleApprove = () => {
    if (!entryId) return;
    approveEntry.mutate(entryId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Approve Entry</DialogTitle>
          <DialogDescription>Are you sure you want to approve this ledger entry?</DialogDescription>
        </DialogHeader>

        <div className=" border border-hairline bg-surface-soft p-4">
          <p className="text-sm text-ink">
            <span className="font-medium">Description:</span> {entryDescription}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApprove} disabled={approveEntry.isPending}>
            {approveEntry.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
