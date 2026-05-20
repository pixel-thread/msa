"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, BookOpen, ArrowLeft, CheckCircle, FileText, ExternalLink, Award, Users, Search } from "lucide-react";
import { useTrainingModule, useMyCompletions, useModuleAssignedUsers } from "../hooks";
import { useAuthStore } from "@src/shared/stores/auth";
import { RecordCompletionSchema, type RecordCompletionInput } from "../validators/training";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Badge } from "@src/shared/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import { DataTable } from "@src/shared/components/data-table";
import { CompleteAssignmentDialog, ManageAssigneesDialog } from "../components";
import type { AssignedUserWithCompletion } from "../types";
import type { TrainingModuleListItem } from "../types";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@src/shared/utils";
import { UserRole } from "@prisma/client";

export function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;

  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  const isSecretaryOrAdmin =
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT) ||
    userRoles.includes(UserRole.SUPER_ADMIN);

  const { module, isLoading: isModuleLoading } = useTrainingModule(moduleId);
  const { completions: myCompletions, recordSelfCompletion, isCompleting, isLoading: isCompletionsLoading } = useMyCompletions();
  const { assignedUsers, isLoading: isAssignedLoading, completeAssignment, isCompleting: isCompletingAssignment } =
    useModuleAssignedUsers(isSecretaryOrAdmin ? moduleId : null);

  const isCompleted = useMemo(() => {
    return myCompletions.some((c) => c.moduleId === moduleId);
  }, [myCompletions, moduleId]);

  const completionDetails = useMemo(() => {
    return myCompletions.find((c) => c.moduleId === moduleId);
  }, [myCompletions, moduleId]);

  const [search, setSearch] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AssignedUserWithCompletion | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

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

  const form = useForm({
    resolver: zodResolver(RecordCompletionSchema),
    defaultValues: {
      certificateUrl: "",
    },
  });

  const onSubmit = (values: RecordCompletionInput) => {
    if (!moduleId) return;

    const formattedValues = {
      certificateUrl: values.certificateUrl || undefined,
    };

    recordSelfCompletion(
      { moduleId, data: formattedValues },
      {
        onSuccess: (res) => {
          if (res.success) {
            form.reset();
          }
        },
      }
    );
  };

  if (isModuleLoading || isCompletionsLoading || isAssignedLoading) {
    return <div className="py-24 text-center text-body">Loading training module details...</div>;
  }

  if (!module) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Module Not Found</h2>
        <p className="text-body mb-6">The training module you are trying to access does not exist or has been removed.</p>
        <Button onClick={() => router.push("/training")} className="rounded-full">
          Back to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
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
            <span className="text-xs text-muted font-medium uppercase tracking-wider">Training Module</span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight">{module.title}</h1>
          </div>
        </div>

        {isSecretaryOrAdmin && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {assignedUsers.length} user{assignedUsers.length !== 1 ? "s" : ""} assigned
            </div>
            <Button
              onClick={() => setAssignDialogOpen(true)}
              variant="outline"
              className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Users className="h-4 w-4" />
              Assign Users
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {module.description && (
            <div className="bg-surface-card border border-hairline rounded-xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-2">Overview</h2>
              <p className="text-sm text-body leading-relaxed">{module.description}</p>
            </div>
          )}

          <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 border-b border-hairline pb-3">
              <BookOpen className="h-4 w-4" />
              Course Material
            </h2>
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {module.content}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-card border border-hairline rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Course Info</h2>
            <div className="space-y-3 text-sm">
              {module.durationMinutes && (
                <div className="flex items-center justify-between py-2 border-b border-hairline">
                  <span className="text-muted flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Estimated time
                  </span>
                  <span className="font-semibold text-ink">{module.durationMinutes} mins</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-hairline">
                <span className="text-muted">Module Version</span>
                <span className="font-semibold text-ink">v{module.version}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-hairline">
                <span className="text-muted">Required For</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {module.requiredForRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-[10px]">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline">
              {isCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Completed Successfully!
                  </div>

                  {completionDetails?.scorePercent !== null && completionDetails?.scorePercent !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-surface-secondary border border-hairline rounded-lg">
                      <span className="text-xs font-medium text-muted flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-500" />
                        Points Earned
                      </span>
                      <span className="text-lg font-bold text-ink">{completionDetails.scorePercent} pts</span>
                    </div>
                  )}

                  {completionDetails?.certificateUrl && (
                    <a
                      href={completionDetails.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 border border-hairline rounded-lg text-xs font-semibold text-primary hover:bg-canvas transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      View Certificate
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  )}
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="certificateUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted">Certificate Link (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/certificate.pdf"
                              className="h-10 border-hairline bg-canvas/30 text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isCompleting} className="w-full h-10 text-xs font-semibold">
                      {isCompleting ? "Recording..." : "Mark as Complete"}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSecretaryOrAdmin && (
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Users
            </h2>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search assigned users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
            />
          </div>

          <DataTable loading={isAssignedLoading} data={filteredUsers} columns={columns} />
        </div>
      )}

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

      {module && (
        <ManageAssigneesDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          module={module as TrainingModuleListItem}
        />
      )}
    </div>
  );
}
