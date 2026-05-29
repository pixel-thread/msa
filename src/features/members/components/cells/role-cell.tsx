'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';
import { Button } from '@src/shared/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ROLES } from '@src/features/members/utils/constants';
import type { User } from '@src/shared/types';

interface RoleCellProps {
  member: User;
  onRoleChange: (memberId: string, role: string, action: 'add' | 'remove') => void;
}

export function RoleCell({ member, onRoleChange }: RoleCellProps) {
  const roles = Array.isArray(member.role) ? member.role : [member.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-40 justify-between border-hairline">
          <span className="truncate">{roles.length > 0 ? roles.join(', ') : 'No role'}</span>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-50">
        <DropdownMenuLabel>Select Roles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((role) => (
          <DropdownMenuCheckboxItem
            key={role}
            checked={roles.includes(role)}
            onCheckedChange={(checked) => {
              onRoleChange(member.id, role, checked ? 'add' : 'remove');
            }}
          >
            {role}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
