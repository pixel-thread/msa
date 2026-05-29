'use client';

import { Button } from '@src/shared/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface MemberType {
  id: string;
  level: number;
  description: string | null;
  _count: {
    users: number;
    subscriptionPlans: number;
  };
}

interface MemberTypeActionsCellProps {
  memberType: MemberType;
  onEdit: (memberType: MemberType) => void;
  onDelete: (memberType: MemberType) => void;
}

export function MemberTypeActionsCell({
  memberType,
  onEdit,
  onDelete,
}: MemberTypeActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => onEdit(memberType)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(memberType)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
