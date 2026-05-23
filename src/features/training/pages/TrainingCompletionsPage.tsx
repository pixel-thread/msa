"use client";

import { useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";

import { Button } from "@src/shared/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import { DataTable } from "@src/shared/components/data-table";
import { useTrainingModule } from "../hooks/useTrainingModules";
import { useTrainingCompletions } from "../hooks/completions/useTrainingCompletions";
import { useTrainingCompletionsColumns } from "../hooks/completions/useTrainingCompletionsColumns";

export function TrainingCompletionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleId = params.id as string;

  const currentPage = Number(searchParams.get("page")) || 1;

  const { module: trainingModule, isLoading: isModuleLoading } =
    useTrainingModule(moduleId);

  const { completions, meta, isLoading: isCompletionsLoading } =
    useTrainingCompletions(moduleId, { page: currentPage });

  const { columns } = useTrainingCompletionsColumns();

  const handlePageChange = useCallback(
    (page: number) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(page));
      router.push(`/training/${moduleId}/completions?${sp.toString()}`);
    },
    [router, searchParams, moduleId],
  );

  const getPageNumbers = (page: number, totalPages: number) => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

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
          <p className="text-2xl font-bold text-ink">
            {meta ? meta.total : completions.length}
          </p>
        </div>
      </div>

      {/* Completions table */}
      <DataTable
        loading={isCompletionsLoading}
        data={completions}
        columns={columns}
      />

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-body">
            Showing{" "}
            <span className="font-medium text-body-strong">
              {(meta.page - 1) * meta.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-body-strong">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-body-strong">{meta.total}</span>{" "}
            completions
          </p>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(currentPage, meta.totalPages).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {meta.totalPages > 5 && currentPage < meta.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage >= meta.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
