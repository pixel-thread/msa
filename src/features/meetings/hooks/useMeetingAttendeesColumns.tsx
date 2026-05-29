'use client';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@src/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@src/shared/components/ui/avatar';
import { Button } from '@src/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Trash2 } from 'lucide-react';

interface AttendeeRow {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  rsvpStatus: string | null;
  attendeeRole: string;
}

interface UseMeetingAttendeesColumnsOptions {
  onRoleChange?: (userId: string, newRole: string) => void;
  onRemoveAttendee?: (userId: string) => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRsvpBadge = (status: string | null) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACCEPTED: 'default',
    DECLINED: 'destructive',
    PENDING: 'outline',
  };
  return <Badge variant={variants[status || 'PENDING'] || 'outline'}>{status || 'PENDING'}</Badge>;
};

const getRoleBadge = (role: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    HOST: 'default',
    CO_HOST: 'secondary',
    REQUIRED: 'default',
    OPTIONAL: 'secondary',
    OBSERVER: 'outline',
  };
  return <Badge variant={variants[role] || 'outline'}>{role}</Badge>;
};

export function useMeetingAttendeesColumns(options?: UseMeetingAttendeesColumnsOptions) {
  const { onRoleChange, onRemoveAttendee } = options ?? {};

  const columns: ColumnDef<AttendeeRow>[] = [
    {
      accessorKey: 'user',
      header: 'Member',
      cell: ({ row }) => {
        const attendee = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(attendee.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{attendee.user.name}</p>
              <p className="text-xs text-muted-foreground">{attendee.user.email}</p>
              {attendee.user.membershipNumber && (
                <p className="text-xs text-muted-foreground">#{attendee.user.membershipNumber}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'attendeeRole',
      header: 'Role',
      cell: ({ row }) => getRoleBadge(row.original.attendeeRole),
    },
    {
      accessorKey: 'rsvpStatus',
      header: 'RSVP Status',
      cell: ({ row }) => getRsvpBadge(row.original.rsvpStatus),
    },
  ];

  if (onRoleChange) {
    columns.push({
      id: 'changeRole',
      header: 'Change Role',
      cell: ({ row }) => (
        <Select
          value={row.original.attendeeRole}
          onValueChange={(value) => onRoleChange(row.original.userId, value)}
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOST">Host</SelectItem>
            <SelectItem value="CO_HOST">Co-Host</SelectItem>
            <SelectItem value="REQUIRED">Required</SelectItem>
            <SelectItem value="OPTIONAL">Optional</SelectItem>
            <SelectItem value="OBSERVER">Observer</SelectItem>
          </SelectContent>
        </Select>
      ),
    });
  }

  if (onRemoveAttendee) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onRemoveAttendee(row.original.userId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    });
  }

  return { columns };
}
