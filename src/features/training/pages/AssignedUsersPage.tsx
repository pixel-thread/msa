"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Badge } from "@src/shared/components/ui/badge";
import { ShieldAlert, ArrowLeft, Search, CheckCircle, Award } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@src/shared/utils";

import { useModuleAssignedUsers } from "../hooks";
import { CompleteAssignmentDialog } from "../components";
import type { AssignedUserWithCompletion } from "../types";

interface AssignedUsersPageProps {
  moduleId: string;
  moduleTitle: string;
}

export function AssignedUsersPage({ moduleId, moduleTitle }: AssignedUsersPageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  const isSecretaryOrAdmin =
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT) ||
    userRoles.includes(UserRole.SUPER_ADMIN);

  const [search, setSearch] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AssignedUserWithCompletion | null>(null);

  const { assignedUsers, isLoading, completeAssignment, isCompleting } =
    useModuleAssignedUsers(moduleId);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return assignedUsers;
    return assignedUsers.filter(
      (u) =>
        u.user?.name?.toLowerCase().includes(query) ||
        u.user?.email?.toLowerCase().includes(query)
    );
  }, [assignedUsers, search]);

  const handleComplete = (data: { userId: string; scorePercent?: number }) => {
    completeAssignment(data);
  };

  const columns: ColumnDef<AssignedUserWithCompletion>[] = [
    {
      accessorKey: "user.name",
      header: "Member",
      cell: ({ row }) => {
        const u = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{u?.name || "Unknown User"}</span>
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1"
                : "bg-surface-secondary text-body border-hairline"
            }
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-3 w-3" />
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
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
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

  if (!isSecretaryOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-2">Access Denied</h2>
        <p className="text-body max-w-md mb-8">
          You do not have the required permissions to view assigned users.
        </p>
        <Button
          onClick={() => router.push("/training")}
          className="h-11 rounded-full bg-primary px-6 font-semibold text-on-primary hover:bg-primary-active flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Training Portal
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => router.push("/training")}
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-sm font-medium text-body hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {moduleTitle}
          </h1>
          <p className="mt-1 text-base text-body">
            View and manage assigned users for this training module.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search assigned users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
          />
        </div>

        <div className="text-sm text-body">
          {assignedUsers.length} user{assignedUsers.length !== 1 ? "s" : ""} assigned
        </div>
      </div>

      <DataTable loading={isLoading} data={filteredUsers} columns={columns} />

      {selectedUser && (
        <CompleteAssignmentDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          userId={selectedUser.userId}
          userName={selectedUser.user.name}
          moduleId={moduleId}
          onComplete={handleComplete}
          isCompleting={isCompleting}
        />
      )}
    </>
  );
}
