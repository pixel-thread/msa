import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';

import { Trash2 } from 'lucide-react';
import { useDeleteTrainingSupplement } from '../../hooks';

type RemoveSupplementProps = {
  isOpen: boolean;
  onValueChange: (open: boolean) => void;
  moduleId: string;
};

export const RemoveSupplementAlertDialog = ({
  isOpen,
  onValueChange,
  moduleId,
}: RemoveSupplementProps) => {
  const { mutate: deleteSupplement, isPending: isDeletingSupplement } =
    useDeleteTrainingSupplement(moduleId);

  const handleConfirmDeleteSupplement = () => {
    deleteSupplement(moduleId, {
      onSettled: () => onValueChange(false),
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onValueChange(false)}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Remove Supplement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this supplement. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onValueChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmDeleteSupplement}
            disabled={isDeletingSupplement}
          >
            {isDeletingSupplement ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
