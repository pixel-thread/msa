import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';

interface Association {
  id: string;
  name: string;
  slug: string;
}

interface DeactivateAssociationDialogProps {
  association: Association | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeactivating: boolean;
}

export function DeactivateAssociationDialog({
  association,
  open,
  onOpenChange,
  onConfirm,
  isDeactivating,
}: DeactivateAssociationDialogProps) {
  if (!association) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate Association</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate{' '}
            <span className="font-medium">{association.name}</span> ({association.slug})? This will
            disable the association and its related services.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeactivating}>
            {isDeactivating ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
