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
import { useDeleteTrainingCertificate } from '../../hooks';

type RemoveCertificateProps = {
  isOpen: boolean;
  onValueChange: (open: boolean) => void;
  moduleId: string;
  certificateId: string;
};

export const RemoveCertificateAlertDialog = ({
  isOpen,
  onValueChange,
  moduleId,
  certificateId,
}: RemoveCertificateProps) => {
  const { mutate: deleteCertificate, isPending: isDeleting } =
    useDeleteTrainingCertificate(moduleId);

  const handleConfirmDelete = () => {
    deleteCertificate(certificateId, {
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
          <AlertDialogTitle>Remove Certificate</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this certificate? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onValueChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
