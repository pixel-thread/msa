"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";

import { Button } from "@src/shared/components/ui/button";
import { DataTable } from "@src/shared/components/data-table";
import { useTrainingModule } from "../hooks/useTrainingModules";
import { useTrainingCompletions } from "../hooks/completions/useTrainingCompletions";
import { useTrainingCompletionsColumns } from "../hooks/completions/useTrainingCompletionsColumns";

export function TrainingCompletionsPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const { module: trainingModule, isLoading: isModuleLoading } =
    useTrainingModule(moduleId);

  const { completions, isLoading: isCompletionsLoading } =
    useTrainingCompletions(moduleId);

  const { columns } = useTrainingCompletionsColumns();

  if (isModuleLoading) {
    return (
      <div className="py-24 text-center text-body">
        Loading completion details...
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
    <div className="mx-auto pb-12 w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Completions</h1>
          <p className="text-sm text-muted-foreground">
            Users who completed{" "}
            <span className="font-semibold text-ink">
              {trainingModule.title}
            </span>
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4">
        <div className="bg-surface-card border border-hairline rounded-xl p-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
            Total Completions
          </div>
          <p className="text-2xl font-bold text-ink">{completions.length}</p>
        </div>
      </div>

      {/* Completions table */}
      <DataTable
        loading={isCompletionsLoading}
        data={completions}
        columns={columns}
      />
    </div>
  );
}
