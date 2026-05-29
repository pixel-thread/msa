import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { SubscriptionPlan } from '../types';

interface DeletePlanDialogProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeletePlanDialog({
  plan,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeletePlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Delete Subscription Plan</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the plan &quot;{plan?.name}&quot;? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
