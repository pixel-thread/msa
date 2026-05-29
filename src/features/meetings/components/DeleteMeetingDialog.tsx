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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';

interface DeleteMeetingDialogProps {
  meeting: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteMeetingDialog({
  meeting,
  open,
  onOpenChange,
  onSuccess,
}: DeleteMeetingDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await http.delete(`/meetings/${meetingId}`);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete meeting');
    },
  });

  const handleDelete = () => {
    if (meeting) {
      deleteMutation.mutate(meeting.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Meeting</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>{meeting?.title}</strong>? This action cannot be
            undone and will remove all associated attendees, agenda items, and minutes.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
