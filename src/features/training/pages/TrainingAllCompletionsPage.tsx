"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, ArrowLeft } from "lucide-react";

import { Button } from "@src/shared/components/ui/button";
import { DataTablePagination } from "@src/shared/components/data-table-pagination";
import { DataTable } from "@src/shared/components/data-table";
import {
  useTrainingCompletionsColumns,
  useTrainingCompletions,
} from "../hooks";

export function TrainingAllCompletionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  const { completions, meta, isLoading } = useTrainingCompletions(null, {
    page: currentPage,
  });
  const { columns } = useTrainingCompletionsColumns({ showModule: true });

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/training/completions?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto pb-12 w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push("/training")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink">All Completions</h1>
          <p className="text-sm text-muted-foreground">
            View all training completions across modules.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4">
        <div className="bg-surface-card border border-hairline p-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
            Total Completions
          </div>
          <p className="text-2xl font-bold text-ink">
            {meta ? meta.total : completions.length}
          </p>
        </div>
      </div>

      {/* Completions table */}
      <DataTable loading={isLoading} data={completions} columns={columns} />

      <DataTablePagination
        meta={meta}
        onPageChange={handlePageChange}
        label="completions"
      />
    </div>
  );
}
