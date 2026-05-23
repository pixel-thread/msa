"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@src/shared/components/ui/pagination";
import { Plus, Search, ShieldAlert, Award } from "lucide-react";

import {
  useTrainingModules,
  useUpdateTrainingModule,
  useModuleTableColumns,
} from "../hooks";
import { CreateModuleDialog } from "../components";

export function TrainingListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  const currentPage = Number(searchParams.get("page")) || 1;

  const isDpoOrAdmin =
    userRoles.includes(UserRole.DPO) ||
    userRoles.includes(UserRole.SUPER_ADMIN) ||
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { modules: allModules, pagination, isLoading: isModulesLoading } =
    useTrainingModules({ page: currentPage });
  const { updateModule } = useUpdateTrainingModule();

  const { columns: moduleColumns } = useModuleTableColumns({
    onManage: (mod) => {
      router.push(`/training/${mod.id}`);
    },
    onToggleActive: (mod) => {
      updateModule({
        moduleId: mod.id,
        data: { isActive: !mod.isActive },
      });
    },
  });

  const filteredModules = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return allModules;
    return allModules.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query),
    );
  }, [allModules, search]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/training?${params.toString()}`);
    },
    [router, searchParams],
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

  if (!isDpoOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-2">Access Denied</h2>
        <p className="text-body max-w-md mb-8">
          You do not have the required permissions to view the training modules
          management panel.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Training Modules
          </h1>
          <p className="mt-1 text-base text-body">
            Manage training modules, assign them to members, and record scores.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search training modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted-foreground focus-visible:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/training/completions")}
            className="h-11 rounded-full border-hairline px-4 text-sm font-semibold"
          >
            <Award className="mr-2 h-4 w-4" />
            Completions
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        </div>
      </div>

      <DataTable
        loading={isModulesLoading}
        data={filteredModules}
        columns={moduleColumns}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-body">
            Showing{" "}
            <span className="font-medium text-body-strong">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-body-strong">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-body-strong">
              {pagination.total}
            </span>{" "}
            modules
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

              {getPageNumbers(currentPage, pagination.totalPages).map((pageNum) => (
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

              {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <CreateModuleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
