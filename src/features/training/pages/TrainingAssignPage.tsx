"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Plus, Trash2 } from "lucide-react";

import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@src/shared/components/ui/tabs";
import {
  useTrainingAssignmentsQuery,
  useAssignTrainingModule,
  useBulkAssignTrainingModule,
  useRemoveTrainingAssignment,
  useBulkRemoveTrainingAssignment,
} from "../hooks/assignments";
import { useTrainingModule } from "../hooks/useTrainingModules";
import { useMembers } from "@src/features/members/hooks/useMembers";
import { UserRow } from "../components/UserRow";
import { SelectAllHeader } from "../components/SelectAllHeader";

interface UserDisplay {
  id: string;
  name: string;
  email: string;
}

export function TrainingAssignPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const { module: trainingModule, isLoading: isModuleLoading } =
    useTrainingModule(moduleId);

  const [activeTab, setActiveTab] = useState<"current" | "add">("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurrent, setSelectedCurrent] = useState<string[]>([]);
  const [selectedAdd, setSelectedAdd] = useState<string[]>([]);

  const { assignments, isLoading: isAssignmentsLoading } =
    useTrainingAssignmentsQuery(moduleId);
  const { assignUser, isAssigning } = useAssignTrainingModule(moduleId);
  const { bulkAssignUsers, isBulkAssigning } = useBulkAssignTrainingModule(
    moduleId,
  );
  const { removeUser, isRemoving } = useRemoveTrainingAssignment(moduleId);
  const { bulkRemoveUsers, isBulkRemoving } = useBulkRemoveTrainingAssignment(
    moduleId,
  );

  const { members, isLoading: isMembersLoading } = useMembers({
    status: "ACTIVE",
  });

  const assignedUserIds = useMemo(
    () => new Set(assignments.map((a) => a.userId)),
    [assignments],
  );

  const assignedUsers = useMemo(
    () => assignments.map((a) => a.user),
    [assignments],
  );

  const unassignedMembers = useMemo(
    () => members.filter((member) => !assignedUserIds.has(member.id)),
    [members, assignedUserIds],
  );

  const filterFn = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;
    return (u: UserDisplay) =>
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value as "current" | "add");
    setSearchQuery("");
    setSelectedCurrent([]);
    setSelectedAdd([]);
  };

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
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleSelectAdd = (userId: string) => {
    setSelectedAdd((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleAllCurrent = () => {
    setSelectedCurrent((prev) =>
      prev.length === filteredCurrent.length
        ? []
        : filteredCurrent.map((u) => u.id),
    );
  };

  const toggleAllAdd = () => {
    setSelectedAdd((prev) =>
      prev.length === filteredAdd.length
        ? []
        : filteredAdd.map((m) => m.id),
    );
  };

  return (
    <div className="mx-auto pb-12 w-full h-full space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push(`/training/${moduleId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink">Manage Assignees</h1>
          {isModuleLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Assign users to{" "}
              <span className="font-semibold text-ink">
                {trainingModule?.title}
              </span>{" "}
              or remove them.
            </p>
          )}
        </div>
      </div>

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
        onValueChange={handleTabChange}
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

        <TabsContent
          value="current"
          className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px] flex flex-col"
        >
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground my-8">
              Loading assignees...
            </p>
          ) : filteredCurrent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No assigned users found.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <SelectAllHeader
                count={selectedCurrent.length}
                total={filteredCurrent.length}
                onToggleAll={toggleAllCurrent}
              />
              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                {filteredCurrent.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedCurrent.includes(user.id)}
                    onToggle={toggleSelectCurrent}
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
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="add"
          className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px] flex flex-col"
        >
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground my-8">
              Loading available members...
            </p>
          ) : filteredAdd.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No available members to assign.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <SelectAllHeader
                count={selectedAdd.length}
                total={filteredAdd.length}
                onToggleAll={toggleAllAdd}
              />
              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                {filteredAdd.map((member) => (
                  <UserRow
                    key={member.id}
                    user={member}
                    isSelected={selectedAdd.includes(member.id)}
                    onToggle={toggleSelectAdd}
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
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
