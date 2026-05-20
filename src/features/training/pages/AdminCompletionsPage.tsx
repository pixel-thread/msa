"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Plus, Search, ShieldAlert, ArrowLeft } from "lucide-react";

import { useAdminCompletions, useCompletionTableColumns } from "../hooks";
import { AdminRecordCompletionDialog } from "../components";

export function AdminCompletionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  const isSecretaryOrAdmin =
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT) ||
    userRoles.includes(UserRole.SUPER_ADMIN);

  const [search, setSearch] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);

  const { completions: allCompletions, isLoading: isCompletionsLoading } = useAdminCompletions();
  const { columns: completionColumns } = useCompletionTableColumns();

  const filteredCompletions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return allCompletions;
    return allCompletions.filter(
      (c) =>
        c.user?.name?.toLowerCase().includes(query) ||
        c.user?.email?.toLowerCase().includes(query) ||
        c.module?.title?.toLowerCase().includes(query)
    );
  }, [allCompletions, search]);

  if (!isSecretaryOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-2">Access Denied</h2>
        <p className="text-body max-w-md mb-8">
          You do not have the required permissions to view the training completions history.
        </p>
        <Button
          onClick={() => router.push("/training")}
          className="h-11 rounded-full bg-primary px-6 font-semibold text-on-primary hover:bg-primary-active flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Training
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Training Completions
          </h1>
          <p className="mt-1 text-base text-body">
            View and record training module completions for all members.
          </p>
        </div>

        <Button
          onClick={() => router.push("/training")}
          variant="outline"
          className="h-11 rounded-full border-hairline px-5 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Training Portal
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search completion records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
          />
        </div>

        <Button
          onClick={() => setRecordOpen(true)}
          className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Completion
        </Button>
      </div>

      <DataTable
        loading={isCompletionsLoading}
        data={filteredCompletions}
        columns={completionColumns}
      />

      <AdminRecordCompletionDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </>
  );
}
