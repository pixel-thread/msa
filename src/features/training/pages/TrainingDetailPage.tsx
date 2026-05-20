"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, BookOpen, ArrowLeft, CheckCircle, FileText, ExternalLink, Award, Users } from "lucide-react";
import { useTrainingModule, useMyCompletions } from "../hooks";
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
import { useMemo } from "react";
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

  const isCompleted = useMemo(() => {
    return myCompletions.some((c) => c.moduleId === moduleId);
  }, [myCompletions, moduleId]);

  const completionDetails = useMemo(() => {
    return myCompletions.find((c) => c.moduleId === moduleId);
  }, [myCompletions, moduleId]);

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

  if (isModuleLoading || isCompletionsLoading) {
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
          <Button
            onClick={() => router.push(`/training/modules/${moduleId}/assigned-users`)}
            variant="outline"
            className="h-10 rounded-full border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
          >
            <Users className="h-4 w-4" />
            View Assigned Users
          </Button>
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
    </div>
  );
}
