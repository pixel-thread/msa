"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ViewAssignedUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleTitle: string;
}

export function ViewAssignedUsersDialog({
  open,
  onOpenChange,
  moduleId,
  moduleTitle,
}: ViewAssignedUsersDialogProps) {
  const router = useRouter();

  const handleNavigate = () => {
    onOpenChange(false);
    router.push(`/training/modules/${moduleId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>View Assigned Users</DialogTitle>
          <DialogDescription>
            Assigned users are now managed directly on the training module detail page.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-surface-secondary p-4">
          <p className="text-sm text-body">
            <span className="font-medium text-ink">Module:</span> {moduleTitle}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleNavigate}>
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Go to Detail Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
