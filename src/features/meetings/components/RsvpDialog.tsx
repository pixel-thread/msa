"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Textarea } from "@src/shared/components/ui/textarea";
import { XIcon as X } from "@phosphor-icons/react";

interface RsvpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "ACCEPTED" | "DECLINED";
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function RsvpDialog({
  open,
  onOpenChange,
  status,
  note,
  onNoteChange,
  onConfirm,
  onCancel,
  isPending,
}: RsvpDialogProps) {
  const isDecline = status === "DECLINED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDecline ? "Decline Invitation" : "Confirm Attendance"}
          </DialogTitle>
          <DialogDescription>
            {isDecline
              ? "Please provide a reason for declining the meeting."
              : "You are about to confirm your attendance for this meeting."}
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
                onChange={(e) => onNoteChange(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={isDecline ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={(isDecline && !note.trim()) || isPending}
          >
            {isDecline ? "Submit Decline" : "Confirm Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RsvpButtonsProps {
  meetingId: string;
  onAccept: (meetingId: string) => void;
  onDecline: (meetingId: string) => void;
  isPending?: boolean;
}

export function RsvpButtons({
  meetingId,
  onAccept,
  onDecline,
  isPending,
}: RsvpButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="xs"
        variant="outline"
        onClick={() => onAccept(meetingId)}
        disabled={isPending}
        className="gap-1"
      >
        <X className="h-3 w-3" />
        Accept
      </Button>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => onDecline(meetingId)}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        Decline
      </Button>
    </div>
  );
}

