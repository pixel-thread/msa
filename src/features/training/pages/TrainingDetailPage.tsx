"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Users,
  Search,
  Pencil,
  Trash2,
  Plus,
  Paperclip,
  Award,
} from "lucide-react";
import {
  useTrainingModule,
  useModuleAssignedUsers,
  useTrainingSupplements,
  useTrainingMemberColumn,
  useTrainingSupplementsColumns,
  useTrainingCompletions,
  useTrainingCompletionsColumns,
} from "../hooks";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Badge } from "@src/shared/components/ui/badge";
import { DataTable } from "@src/shared/components/data-table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@src/shared/components/ui/tabs";
import {
  CompleteAssignmentDialog,
  EditModuleDialog,
  AddSupplementDialog,
} from "../components";
import type { TrainingModuleListItem } from "../types";
import { RemoveSupplementAlertDialog } from "../components/supplements/RemoveSupplementAlertDialog";
import { RemoveModuleAlertDialog } from "../components/RemoveModuleAlertDialog";

export function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();

  const moduleId = (params.moduleId as string) || (params.id as string);

  const { module: trainingModule, isLoading: isModuleLoading } =
    useTrainingModule(moduleId);

  const {
    assignedUsers,
    isLoading: isAssignedLoading,
    completeAssignment,
    isCompleting: isCompletingAssignment,
  } = useModuleAssignedUsers(moduleId);

  const { data: supplements = [], isFetching: isSupplementsLoading } =
    useTrainingSupplements(moduleId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [addSupplementOpen, setAddSupplementOpen] = useState(false);

  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);

  const {
    memberColumns,
    search,
    setSearch,
    filteredUsers,
    selectedUser,
    completeDialogOpen,
    setCompleteDialogOpen,
    handleComplete,
  } = useTrainingMemberColumn({
    assignedUsers,
    completeAssignment,
  });

  const { supplementColumns, supplementToDelete, setSupplementToDelete } =
    useTrainingSupplementsColumns({
      supplements: supplements || [],
    });

  const handleDeleteModule = () => {
    setDeleteModuleDialogOpen(true);
  };

  if (isModuleLoading) {
    return (
      <div className="py-24 text-center text-body">
        Loading training module details...
      </div>
    );
  }

  if (!trainingModule) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Module Not Found</h2>
        <p className="text-body mb-6">
          The training module you are trying to access does not exist or has
          been removed.
        </p>
        <Button
          onClick={() => router.push("/training")}
          className="rounded-full"
        >
          Back to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-12 w-full h-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {trainingModule.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            v{trainingModule.version} &middot;{" "}
            {trainingModule.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setEditDialogOpen(true)}
            variant="outline"
            className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={handleDeleteModule}
            variant="destructive"
            className="h-10 rounded-full px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Training Detail Card */}
      <div className="bg-surface-card border border-hairline rounded-xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {trainingModule.description && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Overview
                </h2>
                <p className="text-sm text-body leading-relaxed">
                  {trainingModule.description}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {trainingModule.durationMinutes && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold text-ink">
                    {trainingModule.durationMinutes} mins
                  </span>
                </div>
              )}
              {trainingModule.requiredForRoles.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Required for: </span>
                  <div className="flex flex-wrap gap-1">
                    {trainingModule.requiredForRoles.map((role: string) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-hairline">
              <span className="text-muted-foreground">Assigned Users</span>
              <span className="font-semibold text-ink">
                {assignedUsers.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-hairline">
              <span className="text-muted-foreground">Supplements</span>
              <span className="font-semibold text-ink">
                {supplements?.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold text-ink">
                {assignedUsers.length > 0
                  ? `${Math.round((assignedUsers.filter((u) => u.status === "COMPLETED").length / assignedUsers.length) * 100)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Members | Supplements */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Supplements
          </TabsTrigger>
          <TabsTrigger value="completions" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Completions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {assignedUsers.length} user{assignedUsers.length !== 1 ? "s" : ""}{" "}
              assigned
            </div>
            <Button
              onClick={() => router.push(`/training/${moduleId}/assign`)}
              variant="outline"
              className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Assign Users
            </Button>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assigned users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted-foreground focus-visible:border-primary"
            />
          </div>
          <DataTable
            loading={isAssignedLoading}
            data={filteredUsers}
            columns={memberColumns}
          />
        </TabsContent>

        <TabsContent value="supplements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {supplements?.length} supplement
              {supplements?.length !== 1 ? "s" : ""}
            </div>
            <Button
              onClick={() => setAddSupplementOpen(true)}
              variant="outline"
              className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Add Supplement
            </Button>
          </div>
          <DataTable
            loading={isSupplementsLoading}
            data={supplements || []}
            columns={supplementColumns}
          />
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Users who completed this module
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
              onClick={() => router.push(`/training/${moduleId}/completions`)}
            >
              <Award className="mr-1.5 h-4 w-4" />
              View All
            </Button>
          </div>
          <CompletionsTabContent moduleId={moduleId} />
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <CompleteAssignmentDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          userId={selectedUser.userId}
          userName={selectedUser.user.name}
          moduleId={moduleId}
          onComplete={handleComplete}
          isCompleting={isCompletingAssignment}
        />
      )}

      {trainingModule && (
        <EditModuleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          module={trainingModule as TrainingModuleListItem}
        />
      )}

      <AddSupplementDialog
        open={addSupplementOpen}
        onOpenChange={setAddSupplementOpen}
        moduleId={moduleId}
      />

      <RemoveModuleAlertDialog
        isOpen={deleteModuleDialogOpen}
        onValueChange={(value) => setDeleteModuleDialogOpen(value)}
        moduleId={moduleId || ""}
      />

      <RemoveSupplementAlertDialog
        isOpen={!!supplementToDelete}
        moduleId={supplementToDelete?.id || ""}
        onValueChange={(v) =>
          setSupplementToDelete(!v ? supplementToDelete : null)
        }
      />
    </div>
  );
}

function CompletionsTabContent({ moduleId }: { moduleId: string }) {
  const { completions, isLoading } = useTrainingCompletions(moduleId);
  const { columns } = useTrainingCompletionsColumns();

  return (
    <DataTable loading={isLoading} data={completions} columns={columns} />
  );
}
