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
import { useDeleteTrainingModule } from '../hooks';
type RemoveModuleAlertDialogProps = {
  isOpen: boolean;
  onValueChange: (open: boolean) => void;
  moduleId: string;
};

export const RemoveModuleAlertDialog = ({
  isOpen,
  moduleId,
  onValueChange,
}: RemoveModuleAlertDialogProps) => {
  const { deleteModule, isDeleting } = useDeleteTrainingModule();

  const handleConfirmDeleteModule = () => {
    deleteModule(moduleId, {
      onSuccess: (data) => {
        if (data.success) {
          onValueChange(false);
        }
      },
    });
  };
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onValueChange(false)}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Module</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this training module? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onValueChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmDeleteModule}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
