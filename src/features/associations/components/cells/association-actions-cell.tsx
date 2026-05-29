'use client';

import { Button } from '@src/shared/components/ui/button';
import { Pencil, Power } from 'lucide-react';
import { Association } from '../../types/association';

interface AssociationActionsCellProps {
  association: Association;
  onEdit: (association: Association) => void;
  onDeactivate: (association: Association) => void;
}

export function AssociationActionsCell({
  association,
  onEdit,
  onDeactivate,
}: AssociationActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => onEdit(association)}>
        <Pencil className="h-4 w-4" />
      </Button>
      {association.isActive && (
        <Button size="sm" variant="ghost" onClick={() => onDeactivate(association)}>
          <Power className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
