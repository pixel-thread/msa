import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { getInitials } from '../utils/helper/get-initials';
import { PendingActionsCell } from '@src/features/members/components/cells/pending-actions-cell';
import { MemberListItem } from '../types';

interface UsePendingMemberColumnsOptions {
  onAccept: (member: MemberListItem) => void;
  onReject: (memberId: string) => void;
  isRejecting: boolean;
}

export function usePendingMemberColumns({
  onAccept,
  onReject,
  isRejecting,
}: UsePendingMemberColumnsOptions) {
  const columns: ColumnDef<MemberListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Member',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <Link
            className="flex items-center gap-3 text-left hover:underline"
            href={`/members/${member.id}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{member.name}</span>
              {member.membershipNumber && (
                <span className="text-xs text-muted-foreground">{member.membershipNumber}</span>
              )}
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <PendingActionsCell
          member={row.original}
          onAccept={onAccept}
          onReject={onReject}
          isRejecting={isRejecting}
        />
      ),
    },
  ];
  return { columns };
}
