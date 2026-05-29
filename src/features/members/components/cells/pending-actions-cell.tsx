'use client';

import { Button } from '@src/shared/components/ui/button';
import { Check, X } from 'lucide-react';
import { MemberListItem } from '../../types';

interface PendingActionsCellProps {
  member: MemberListItem;
  onAccept: (member: MemberListItem) => void;
  onReject: (memberId: string) => void;
  isRejecting: boolean;
}

export function PendingActionsCell({
  member,
  onAccept,
  onReject,
  isRejecting,
}: PendingActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="default" onClick={() => onAccept(member)}>
        <Check className="h-4 w-4 mr-1" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onReject(member.id)}
        disabled={isRejecting}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
