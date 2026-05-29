'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import {
  useTrainingAssignmentsQuery,
  useAssignTrainingModule,
  useBulkAssignTrainingModule,
  useRemoveTrainingAssignment,
  useBulkRemoveTrainingAssignment,
} from '../hooks/assignments';
import { useTrainingModule } from '../hooks/useTrainingModules';
import { useMembers } from '@src/features/members/hooks/useMembers';
import { UserRow } from '../components/UserRow';
import { PaneHeader } from '../components/PaneHeader';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useUrlFilters } from '@hooks/use-url-filters';

interface UserDisplay {
  id: string;
  name: string;
  email: string;
}

export function TrainingAssignPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const { page, setPage } = useUrlFilters();

  const { module: trainingModule, isLoading: isModuleLoading } = useTrainingModule(moduleId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrent, setSelectedCurrent] = useState<string[]>([]);
  const [selectedAdd, setSelectedAdd] = useState<string[]>([]);
  const [assignmentPage, setAssignmentPage] = useState(1);

  const {
    assignments,
    isLoading: isAssignmentsLoading,
    assignmentMeta,
  } = useTrainingAssignmentsQuery({ moduleId, page: assignmentPage });
  const { assignUser, isAssigning } = useAssignTrainingModule(moduleId);
  const { bulkAssignUsers, isBulkAssigning } = useBulkAssignTrainingModule(moduleId);
  const { removeUser, isRemoving } = useRemoveTrainingAssignment(moduleId);
  const { bulkRemoveUsers, isBulkRemoving } = useBulkRemoveTrainingAssignment(moduleId);

  const {
    members,
    meta,
    isLoading: isMembersLoading,
  } = useMembers({
    status: 'ACTIVE',
    page,
  });

  const assignedUserIds = useMemo(() => new Set(assignments.map((a) => a.userId)), [assignments]);

  const assignedUsers = useMemo(() => assignments.map((a) => a.user), [assignments]);

  const unassignedMembers = useMemo(
    () => members.filter((member) => !assignedUserIds.has(member.id)),
    [members, assignedUserIds],
  );

  const filterFn = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;
    return (u: UserDisplay) =>
      u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
  }, [searchQuery]);

  const filteredCurrent = useMemo(
    () => (filterFn ? assignedUsers.filter(filterFn) : assignedUsers),
    [assignedUsers, filterFn],
  );

  const filteredAdd = useMemo(
    () => (filterFn ? unassignedMembers.filter(filterFn) : unassignedMembers),
    [unassignedMembers, filterFn],
  );

  const isLoading = isAssignmentsLoading || isMembersLoading;
  const totalSelected = selectedCurrent.length + selectedAdd.length;

  const handleAssignSingle = (userId: string) => {
    assignUser(userId, {
      onSuccess: () => {
        setSelectedAdd((prev) => prev.filter((id) => id !== userId));
      },
    });
  };

  const handleRemoveSingle = (userId: string) => {
    removeUser(userId, {
      onSuccess: () => {
        setSelectedCurrent((prev) => prev.filter((id) => id !== userId));
      },
    });
  };

  const handleBulkAssign = () => {
    if (selectedAdd.length === 0) return;
    bulkAssignUsers(selectedAdd, {
      onSuccess: () => setSelectedAdd([]),
    });
  };

  const handleBulkRemove = () => {
    if (selectedCurrent.length === 0) return;
    bulkRemoveUsers(selectedCurrent, {
      onSuccess: () => setSelectedCurrent([]),
    });
  };

  const toggleSelectCurrent = (userId: string) => {
    setSelectedCurrent((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const toggleSelectAdd = (userId: string) => {
    setSelectedAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const toggleAllCurrent = () => {
    setSelectedCurrent((prev) =>
      prev.length === filteredCurrent.length ? [] : filteredCurrent.map((u) => u.id),
    );
  };

  const toggleAllAdd = () => {
    setSelectedAdd((prev) =>
      prev.length === filteredAdd.length ? [] : filteredAdd.map((m) => m.id),
    );
  };

  const clearSelection = () => {
    setSelectedCurrent([]);
    setSelectedAdd([]);
  };

  return (
    <div className="mx-auto pb-12 w-full h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-ink">Manage Assignees</h1>
          {isModuleLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Assign users to{' '}
              <span className="font-semibold text-ink">{trainingModule?.title}</span> or remove
              them.
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative pb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9 h-10 border-hairline bg-canvas/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Dual pane */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Assigned pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface-card border border-hairline p-3">
          <PaneHeader
            title="Assigned"
            count={selectedCurrent.length}
            total={filteredCurrent.length}
            onToggleAll={toggleAllCurrent}
          />

          <div className="flex-1 space-y-2 overflow-y-auto mt-2 pr-1">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
            ) : filteredCurrent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? (
                    <>No results for &quot;{searchQuery}&quot;</>
                  ) : (
                    <>No users assigned yet</>
                  )}
                </p>
                {!searchQuery && unassignedMembers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select users from the available pane to assign them.
                  </p>
                )}
              </div>
            ) : (
              filteredCurrent.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelected={selectedCurrent.includes(user.id)}
                  onToggle={toggleSelectCurrent}
                  onClickRow={handleRemoveSingle}
                  actionButton={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveSingle(user.id)}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              ))
            )}
            <DataTablePagination meta={assignmentMeta} onPageChange={setAssignmentPage} />
          </div>
        </div>

        {/* Available pane */}
        <div className="flex-1 space-y-2 flex flex-col min-h-0 bg-surface-card border border-hairline p-3">
          <PaneHeader
            title="Available"
            count={selectedAdd.length}
            total={filteredAdd.length}
            onToggleAll={toggleAllAdd}
          />

          <div className="flex-1 space-y-1 overflow-y-auto mt-2 pr-1">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
            ) : filteredAdd.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? (
                    <>No results for &quot;{searchQuery}&quot;</>
                  ) : (
                    <>All users are assigned</>
                  )}
                </p>
                {!searchQuery && assignedUsers.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Unassign users from the left pane to free them up.
                  </p>
                )}
              </div>
            ) : (
              filteredAdd.map((member) => (
                <UserRow
                  key={member.id}
                  user={member}
                  isSelected={selectedAdd.includes(member.id)}
                  onToggle={toggleSelectAdd}
                  onClickRow={handleAssignSingle}
                  actionButton={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => handleAssignSingle(member.id)}
                      disabled={isAssigning}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              ))
            )}
          </div>
          <DataTablePagination meta={meta} onPageChange={setPage} />
        </div>
      </div>

      {/* Sticky bottom bar */}
      {totalSelected > 0 && (
        <div className="shrink-0 pt-3">
          <div className="flex items-center justify-between bg-ink text-white px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{totalSelected} selected</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="text-white/60 hover:text-white h-auto w-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {selectedCurrent.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold px-3 bg-white/15 text-white hover:bg-white/25"
                  onClick={handleBulkRemove}
                  disabled={isBulkRemoving}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Unassign ({selectedCurrent.length})
                </Button>
              )}
              {selectedAdd.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs font-semibold px-3 bg-white/15 text-white hover:bg-white/25"
                  onClick={handleBulkAssign}
                  disabled={isBulkAssigning}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Assign ({selectedAdd.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
