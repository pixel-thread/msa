"use client";

import { useState, useMemo } from "react";
import { User, TrainingModule } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Trash2, Check, X, CheckSquare, Square } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/shared/components/ui/tabs";
import {
  useTrainingAssignmentsQuery,
  useAssignTrainingModule,
  useBulkAssignTrainingModule,
  useRemoveTrainingAssignment,
  useBulkRemoveTrainingAssignment,
} from "../hooks/assignments";
import { useMembers } from "@src/features/members/hooks/useMembers";
import type { TrainingModuleListItem } from "../types";

interface ManageAssigneesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: TrainingModuleListItem | null;
}

export function ManageAssigneesDialog({ open, onOpenChange, module }: ManageAssigneesDialogProps) {
  const [activeTab, setActiveTab] = useState<"current" | "add">("current");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track selected users for bulk actions
  const [selectedCurrent, setSelectedCurrent] = useState<string[]>([]);
  const [selectedAdd, setSelectedAdd] = useState<string[]>([]);

  // Fetch all assignments for this module
  const { assignments, isLoading: isAssignmentsLoading } =
    useTrainingAssignmentsQuery(module?.id ?? null);
  const { assignUser, isAssigning } =
    useAssignTrainingModule(module?.id ?? null);
  const { bulkAssignUsers, isBulkAssigning } =
    useBulkAssignTrainingModule(module?.id ?? null);
  const { removeUser, isRemoving } =
    useRemoveTrainingAssignment(module?.id ?? null);
  const { bulkRemoveUsers, isBulkRemoving } =
    useBulkRemoveTrainingAssignment(module?.id ?? null);

  // Fetch all active members
  const { members, isLoading: isMembersLoading } = useMembers({ status: "ACTIVE" });

  // Filter members into currently assigned and unassigned
  const assignedUserIds = useMemo(() => {
    return new Set(assignments.map((a) => a.userId));
  }, [assignments]);

  const assignedUsers = useMemo(() => {
    return assignments.map((a) => a.user).filter(Boolean);
  }, [assignments]);

  const unassignedMembers = useMemo(() => {
    return members.filter((member) => !assignedUserIds.has(member.id));
  }, [members, assignedUserIds]);

  // Search filter
  const filteredCurrent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return assignedUsers;
    return assignedUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  }, [assignedUsers, searchQuery]);

  const filteredAdd = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return unassignedMembers;
    return unassignedMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query)
    );
  }, [unassignedMembers, searchQuery]);

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
      onSuccess: () => {
        setSelectedAdd([]);
      },
    });
  };

  const handleBulkRemove = () => {
    if (selectedCurrent.length === 0) return;
    bulkRemoveUsers(selectedCurrent, {
      onSuccess: () => {
        setSelectedCurrent([]);
      },
    });
  };

  const toggleSelectCurrent = (userId: string) => {
    setSelectedCurrent((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAdd = (userId: string) => {
    setSelectedAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllCurrent = () => {
    if (selectedCurrent.length === filteredCurrent.length) {
      setSelectedCurrent([]);
    } else {
      setSelectedCurrent(filteredCurrent.map((u) => u.id));
    }
  };

  const toggleAllAdd = () => {
    if (selectedAdd.length === filteredAdd.length) {
      setSelectedAdd([]);
    } else {
      setSelectedAdd(filteredAdd.map((m) => m.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>Manage Assignees</DialogTitle>
          <DialogDescription>
            Assign users to <span className="font-semibold text-ink">{module?.title}</span> or remove them.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 h-10 border-hairline bg-canvas/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as any);
            setSearchQuery("");
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex justify-between items-center border-b pb-2">
            <TabsList className="bg-canvas/50 p-1">
              <TabsTrigger value="current" className="px-4 py-1.5 text-xs">
                Assigned ({assignedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="add" className="px-4 py-1.5 text-xs">
                Available ({unassignedMembers.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === "current" && selectedCurrent.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 rounded-full text-xs font-semibold px-3"
                onClick={handleBulkRemove}
                disabled={isBulkRemoving}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Unassign Selected ({selectedCurrent.length})
              </Button>
            )}

            {activeTab === "add" && selectedAdd.length > 0 && (
              <Button
                size="sm"
                className="h-8 rounded-full text-xs font-semibold px-3"
                onClick={handleBulkAssign}
                disabled={isBulkAssigning}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Assign Selected ({selectedAdd.length})
              </Button>
            )}
          </div>

          {/* Current Assignees Tab */}
          <TabsContent
            value="current"
            className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px] flex flex-col"
          >
            {isAssignmentsLoading || isMembersLoading ? (
              <p className="text-center text-sm text-muted-foreground my-8">Loading assignees...</p>
            ) : filteredCurrent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No assigned users found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-1 border-b text-xs text-muted-foreground font-medium">
                  <button
                    onClick={toggleAllCurrent}
                    className="hover:text-ink text-muted-foreground flex items-center"
                  >
                    {selectedCurrent.length === filteredCurrent.length ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <span className="flex-1">Select All / User Details</span>
                  <span>Action</span>
                </div>

                <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                  {filteredCurrent.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedCurrent.includes(user.id)
                          ? "bg-primary/5 border-primary/20"
                          : "bg-surface-card hover:bg-canvas/50"
                      }`}
                    >
                      <button
                        onClick={() => toggleSelectCurrent(user.id)}
                        className="text-muted-foreground hover:text-ink"
                      >
                        {selectedCurrent.includes(user.id) ? (
                          <CheckSquare className="h-4.5 w-4.5 text-primary" />
                        ) : (
                          <Square className="h-4.5 w-4.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveSingle(user.id)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Add Assignees Tab */}
          <TabsContent
            value="add"
            className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px] flex flex-col"
          >
            {isAssignmentsLoading || isMembersLoading ? (
              <p className="text-center text-sm text-muted-foreground my-8">Loading available members...</p>
            ) : filteredAdd.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No available members to assign.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-1 border-b text-xs text-muted-foreground font-medium">
                  <button
                    onClick={toggleAllAdd}
                    className="hover:text-ink text-muted-foreground flex items-center"
                  >
                    {selectedAdd.length === filteredAdd.length ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <span className="flex-1">Select All / User Details</span>
                  <span>Action</span>
                </div>

                <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                  {filteredAdd.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedAdd.includes(member.id)
                          ? "bg-primary/5 border-primary/20"
                          : "bg-surface-card hover:bg-canvas/50"
                      }`}
                    >
                      <button
                        onClick={() => toggleSelectAdd(member.id)}
                        className="text-muted-foreground hover:text-ink"
                      >
                        {selectedAdd.includes(member.id) ? (
                          <CheckSquare className="h-4.5 w-4.5 text-primary" />
                        ) : (
                          <Square className="h-4.5 w-4.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => handleAssignSingle(member.id)}
                        disabled={isAssigning}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
