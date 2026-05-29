import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';

interface MemberType {
  id: string;
  level: number;
  description: string | null;
}

interface DeleteMemberTypeDialogProps {
  memberType: MemberType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteMemberTypeDialog({
  memberType,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteMemberTypeDialogProps) {
  if (!memberType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Member Type</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete member type level {memberType.level}
            {memberType.description ? ` (${memberType.description})` : ''}? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
