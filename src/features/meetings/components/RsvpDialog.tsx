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
import { Textarea } from '@src/shared/components/ui/textarea';
import { useRsvp } from '../hooks';

interface RsvpDialogProps {
  onOpenChange: (open: boolean) => void;
}

export function RsvpDialog({ onOpenChange }: RsvpDialogProps) {
  const {
    rsvpForm,
    rsvpDialogOpen: open,
    setRsvpForm,
    closeRsvpDialog,
    submitRsvp,
    isPending,
  } = useRsvp();
  const note = rsvpForm.note;
  const status = rsvpForm.status;
  const isDecline = status === 'DECLINED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isDecline ? 'Decline Invitation' : 'Confirm Attendance'}</DialogTitle>
          <DialogDescription>
            {isDecline
              ? 'Please provide a reason for declining the meeting.'
              : 'You are about to confirm your attendance for this meeting.'}
          </DialogDescription>
        </DialogHeader>

        {isDecline && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Reason for declining <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please provide your reason for declining..."
                value={note}
                onChange={(e) => {
                  const value = e.target.value;
                  setRsvpForm({
                    status: isDecline ? 'DECLINED' : 'ACCEPTED',
                    note: value,
                  });
                }}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={closeRsvpDialog} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={isDecline ? 'destructive' : 'default'}
            onClick={submitRsvp}
            disabled={(isDecline && !note?.trim()) || isPending}
          >
            {isDecline ? 'Submit Decline' : 'Confirm Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
