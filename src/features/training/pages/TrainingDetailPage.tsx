"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ArrowLeft,
  CheckCircle,
  Award,
  Users,
  Search,
  Pencil,
  Trash2,
  Plus,
  Paperclip,
} from "lucide-react";
import {
  useTrainingModule,
  useModuleAssignedUsers,
  useTrainingModules,
  useTrainingSupplements,
} from "../hooks";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Badge } from "@src/shared/components/ui/badge";
import { DataTable } from "@src/shared/components/data-table";
import {
  CompleteAssignmentDialog,
  ManageAssigneesDialog,
  EditModuleDialog,
  AddSupplementDialog,
} from "../components";
import type {
  AssignedUserWithCompletion,
  TrainingModuleListItem,
} from "../types";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@src/shared/utils";

export function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = (params.moduleId as string) || (params.id as string);

  const { module: trainingModule, isLoading: isModuleLoading } =
    useTrainingModule(moduleId);
  const { deleteModule, isDeleting } = useTrainingModules();
  const {
    assignedUsers,
    isLoading: isAssignedLoading,
    completeAssignment,
    isCompleting: isCompletingAssignment,
  } = useModuleAssignedUsers(moduleId);
  const { supplements, isLoading: isSupplementsLoading } =
    useTrainingSupplements(moduleId);

  const [search, setSearch] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<AssignedUserWithCompletion | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSupplementOpen, setAddSupplementOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return assignedUsers;
    return assignedUsers.filter(
      (u) =>
        u.user?.name?.toLowerCase().includes(query) ||
        u.user?.email?.toLowerCase().includes(query),
    );
  }, [assignedUsers, search]);

  const handleComplete = (data: { userId: string; scorePercent?: number }) => {
    completeAssignment(data);
  };

  const handleDeleteModule = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this training module? This action cannot be undone.",
      )
    ) {
      deleteModule(moduleId, {
        onSuccess: () => {
          router.push("/training");
        },
      });
    }
  };

  const columns: ColumnDef<AssignedUserWithCompletion>[] = [
    {
      accessorKey: "user.name",
      header: "Member",
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">
              {u?.name || "Unknown User"}
            </span>
            <span className="text-xs text-muted-foreground">{u?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isCompleted = status === "COMPLETED";
        return (
          <Badge
            className={
              isCompleted
                ? "bg-semantic-up/10 text-semantic-up border-semantic-up/20"
                : "bg-surface-soft text-body border-hairline"
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
      accessorKey: "completion.scorePercent",
      header: "Points",
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
      accessorKey: "assignedAt",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedAt = row.original.assignedAt;
        return (
          <span className="text-sm text-body">
            {assignedAt ? formatDate(assignedAt) : "N/A"}
          </span>
        );
      },
    },
    {
      accessorKey: "completion.completedAt",
      header: "Completed",
      cell: ({ row }) => {
        const completedAt = row.original.completion?.completedAt;
        return (
          <span className="text-sm text-body">
            {completedAt ? formatDate(completedAt) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const assignment = row.original;
        const isCompleted = assignment.status === "COMPLETED";

        return (
          <Button
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            disabled={isCompleted}
            onClick={() => {
              setSelectedUser(assignment);
              setCompleteDialogOpen(true);
            }}
            className="h-9 rounded-full text-xs font-semibold"
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
    <div className="mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/training")}
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-full hover:bg-canvas"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Module Management</span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight">{trainingModule.title}</h1>
          </div>
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
            disabled={isDeleting}
            className="h-10 rounded-full px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {trainingModule.description && (
            <div className="bg-surface-card border border-hairline rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Overview
              </h2>
              <p className="text-sm text-body leading-relaxed">
                {trainingModule.description}
              </p>
            </div>
          )}

          {/* Supplements Section */}
          <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4" />
                Supplements
              </h2>
              <Button
                onClick={() => setAddSupplementOpen(true)}
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-primary"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Supplement
              </Button>
            </div>

            {isSupplementsLoading ? (
              <p className="text-sm text-muted-foreground">Loading supplements...</p>
            ) : supplements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No supplements added yet.</p>
            ) : (
              <ul className="space-y-2">
                {supplements.map(
                  (sup: {
                    id: string;
                    title: string;
                    type: string;
                    description?: string;
                    downloadUrl?: string;
                  }) => (
                    <li
                      key={sup.id}
                      className="flex flex-col bg-canvas p-3 rounded-lg border border-hairline"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-sm text-ink">
                            {sup.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px]"
                          >
                            {sup.type}
                          </Badge>
                        </div>
                      </div>
                      {sup.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {sup.description}
                        </p>
                      )}
                      {sup.downloadUrl && (
                        <a
                          href={sup.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          View Resource
                        </a>
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Course Info
            </h2>
            <div className="space-y-3 text-sm">
              {trainingModule.durationMinutes && (
                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Estimated time
                  </span>
                  <span className="font-semibold text-ink">
                    {trainingModule.durationMinutes} mins
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-hairline">
                <span className="text-muted-foreground">Module Version</span>
                <span className="font-semibold text-ink">
                  v{trainingModule.version}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-hairline">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={trainingModule.isActive ? "default" : "destructive"}
                >
                  {trainingModule.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-hairline">
                <span className="text-muted-foreground">Required For</span>
                <div className="flex flex-wrap gap-1 justify-end">
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
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Users
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 hidden sm:flex">
              {assignedUsers.length} user{assignedUsers.length !== 1 ? "s" : ""}{" "}
              assigned
            </div>
            <Button
              onClick={() => setAssignDialogOpen(true)}
              variant="outline"
              className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Assign Users
            </Button>
          </div>
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
          columns={columns}
        />
      </div>

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
        <ManageAssigneesDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          module={trainingModule as TrainingModuleListItem}
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
    </div>
  );
}
