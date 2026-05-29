'use client';

import * as React from 'react';
import type { User } from '@src/shared/types';
import { useAssociationsList } from '@src/features/associations/hooks/useAssociationsList';
import { Button } from '@src/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@src/shared/components/ui/alert-dialog';

interface AssociationCellProps {
  member: User;
  onAssociationChange: (memberId: string, associationId: string) => void;
}

export function AssociationCell({ member, onAssociationChange }: AssociationCellProps) {
  const { associations, isLoading } = useAssociationsList();
  const [selectedAssociationId, setSelectedAssociationId] = React.useState<string>('');
  const [open, setOpen] = React.useState(false);

  const currentAssociation = associations.find((a) => a.id === member.associationId);

  const handleConfirm = () => {
    if (!selectedAssociationId) return;
    onAssociationChange(member.id, selectedAssociationId);
    setOpen(false);
    setSelectedAssociationId('');
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-40 border-hairline">
          {currentAssociation?.slug ?? member.associationId ?? 'Unknown'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Member</AlertDialogTitle>
          <AlertDialogDescription>Select a new association for this member.</AlertDialogDescription>
        </AlertDialogHeader>

        <Select
          value={selectedAssociationId}
          onValueChange={setSelectedAssociationId}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an association..." />
          </SelectTrigger>
          <SelectContent>
            {associations
              .filter((a) => a.id !== member.associationId)
              .map((association) => (
                <SelectItem key={association.id} value={association.id}>
                  {association.slug}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!selectedAssociationId}>
            Confirm Transfer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
