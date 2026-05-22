"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  Award,
  Users,
  Search,
  Pencil,
  Trash2,
  Plus,
  Paperclip,
  Download,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@src/shared/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@src/shared/components/ui/alert-dialog";
import {
  CompleteAssignmentDialog,
  ManageAssigneesDialog,
  EditModuleDialog,
  AddSupplementDialog,
} from "../components";
import type {
  AssignedUserWithCompletion,
  TrainingModuleListItem,
  TrainingSupplementItem,
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
  const {
    supplements,
    isLoading: isSupplementsLoading,
    deleteSupplement,
    isDeleting: isDeletingSupplement,
  } = useTrainingSupplements(moduleId);

  const [search, setSearch] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<AssignedUserWithCompletion | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSupplementOpen, setAddSupplementOpen] = useState(false);
  const [supplementToDelete, setSupplementToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("members");

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

  const handleDeleteSupplement = (supplementId: string) => {
    const supplement = supplements.find((s) => s.id === supplementId);
    setSupplementToDelete(
      supplement
        ? { id: supplement.id, title: supplement.title }
        : { id: supplementId, title: "this supplement" },
    );
  };

  const handleConfirmDeleteSupplement = () => {
    if (!supplementToDelete) return;
    deleteSupplement(supplementToDelete.id, {
      onSettled: () => setSupplementToDelete(null),
    });
  };

  const handleDeleteModule = () => {
    setDeleteModuleDialogOpen(true);
  };

  const handleConfirmDeleteModule = () => {
    deleteModule(moduleId, {
      onSuccess: () => {
        router.push("/training");
      },
    });
  };

  const memberColumns: ColumnDef<AssignedUserWithCompletion>[] = [
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

  const supplementColumns: ColumnDef<TrainingSupplementItem>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{s.title}</span>
            {s.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {s.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "fileSize",
      header: "Size",
      cell: ({ row }) => {
        const bytes = row.original.fileSize;
        if (bytes === null || bytes === undefined)
          return <span className="text-sm text-muted-foreground">—</span>;
        const kb = bytes / 1024;
        const mb = kb / 1024;
        return (
          <span className="text-sm text-body">
            {mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(0)} KB`}
          </span>
        );
      },
    },
    {
      accessorKey: "durationSeconds",
      header: "Duration",
      cell: ({ row }) => {
        const secs = row.original.durationSeconds;
        if (secs === null || secs === undefined)
          return <span className="text-sm text-muted-foreground">—</span>;
        const mins = Math.round(secs / 60);
        return (
          <span className="text-sm text-body flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {mins} min
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-sm text-body">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1">
            {s.fileUrl && (
              <a href={s.fileUrl} target="_blank" rel="noreferrer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Button
              onClick={() => handleDeleteSupplement(s.id)}
              variant="ghost"
              size="sm"
              disabled={isDeletingSupplement && supplementToDelete?.id === s.id}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
            disabled={isDeleting}
            className="h-10 rounded-full px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
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
                {supplements.length}
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Supplements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
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
              {supplements.length} supplement
              {supplements.length !== 1 ? "s" : ""}
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
            data={supplements}
            columns={supplementColumns}
          />
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

      <AlertDialog
        open={deleteModuleDialogOpen}
        onOpenChange={(open) => !open && setDeleteModuleDialogOpen(false)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training module? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteModuleDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteModule}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!supplementToDelete}
        onOpenChange={(open) => !open && setSupplementToDelete(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove Supplement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove
              {` "${supplementToDelete?.title}" ` || "this supplement"}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplementToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteSupplement}
              disabled={isDeletingSupplement}
            >
              {isDeletingSupplement ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
