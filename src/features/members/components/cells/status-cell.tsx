'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { STATUSES } from '@src/features/members/utils/constants';
import type { User } from '@src/shared/types';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';

interface StatusCellProps {
  member: User;
  onStatusChange: (memberId: string, status: string) => void;
}

export function StatusCell({ member, onStatusChange }: StatusCellProps) {
  return (
    <Select
      value={member.status}
      onValueChange={(newStatus) => {
        onStatusChange(member.id, newStatus);
      }}
    >
      <SelectTrigger className="h-8 w-35 border-hairline">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {getStatusBadge(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
