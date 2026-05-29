'use client';

import { Button } from '@src/shared/components/ui/button';
import { Check, X } from 'lucide-react';
import { MembershipApplicationListItem } from '../../types';

interface MembershipApplicationActionsCellProps {
  application: MembershipApplicationListItem;
  onReview: (application: MembershipApplicationListItem) => void;
  onReject: (applicationId: string) => void;
  isRejecting: boolean;
}

export function MembershipApplicationActionsCell({
  application,
  onReview,
  onReject,
  isRejecting,
}: MembershipApplicationActionsCellProps) {
  if (application.status !== 'PENDING') {
    return (
      <span className="text-sm text-muted-foreground">
        {application.status === 'APPROVED' ? 'Approved' : 'Rejected'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="default" onClick={() => onReview(application)}>
        <Check className="h-4 w-4 mr-1" />
        Review
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onReject(application.id)}
        disabled={isRejecting}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
