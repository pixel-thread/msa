'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, Award } from 'lucide-react';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@src/shared/utils';
import type { AssignedUserWithCompletion } from '../types';

export function useTrainingMemberColumn(options: {
  assignedUsers: AssignedUserWithCompletion[];

  completeAssignment: (data: {
    userId: string;
    scorePercent?: number;
    certificateOption?: 'none' | 'global' | 'custom';
    certificateFile?: File | null;
  }) => void;
}) {
  const { assignedUsers, completeAssignment } = options;

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AssignedUserWithCompletion | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return assignedUsers;
    return assignedUsers.filter(
      (u) =>
        u.user?.name?.toLowerCase().includes(query) || u.user?.email?.toLowerCase().includes(query),
    );
  }, [assignedUsers, search]);

  const handleComplete = (data: {
    userId: string;
    scorePercent?: number;
    certificateOption?: 'none' | 'global' | 'custom';
    certificateFile?: File | null;
  }) => {
    completeAssignment(data);
  };

  const memberColumns: ColumnDef<AssignedUserWithCompletion>[] = [
    {
      accessorKey: 'user.name',
      header: 'Member',
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{u?.name || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">{u?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isCompleted = status === 'COMPLETED';
        return (
          <Badge
            className={
              isCompleted
                ? 'bg-semantic-up/10 text-semantic-up border-semantic-up/20'
                : 'bg-surface-soft text-body border-hairline'
            }
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </>
            ) : (
              status
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'completion.scorePercent',
      header: 'Points',
      cell: ({ row }) => {
        const score = row.original.completion?.scorePercent;
        return (
          <span className="text-sm text-body">
            {score !== null && score !== undefined ? (
              <span className="flex items-center gap-1 text-semantic-up font-medium">
                <Award className="h-3.5 w-3.5" />
                {score} pts
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'assignedAt',
      header: 'Assigned',
      cell: ({ row }) => {
        const assignedAt = row.original.assignedAt;
        return (
          <span className="text-sm text-body">{assignedAt ? formatDate(assignedAt) : 'N/A'}</span>
        );
      },
    },
    {
      accessorKey: 'completion.completedAt',
      header: 'Completed',
      cell: ({ row }) => {
        const completedAt = row.original.completion?.completedAt;
        return (
          <span className="text-sm text-body">{completedAt ? formatDate(completedAt) : '—'}</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original;
        const isCompleted = assignment.status === 'COMPLETED';

        return (
          <Button
            variant={isCompleted ? 'outline' : 'default'}
            size="sm"
            disabled={isCompleted}
            onClick={() => {
              setSelectedUser(assignment);
              setCompleteDialogOpen(true);
            }}
            className="h-9 text-xs font-semibold"
          >
            {isCompleted ? (
              <>
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Done
              </>
            ) : (
              <>
                <Award className="mr-1.5 h-3.5 w-3.5" />
                Mark Complete
              </>
            )}
          </Button>
        );
      },
    },
  ];

  return {
    memberColumns,
    search,
    setSearch,
    filteredUsers,
    selectedUser,
    completeDialogOpen,
    setCompleteDialogOpen,
    handleComplete,
  };
}
