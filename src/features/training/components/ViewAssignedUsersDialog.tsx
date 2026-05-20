"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { AssignedUsersPage } from "../pages/AssignedUsersPage";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Assigned Users</DialogTitle>
        </DialogHeader>
        <AssignedUsersPage moduleId={moduleId} moduleTitle={moduleTitle} />
      </DialogContent>
    </Dialog>
  );
}
