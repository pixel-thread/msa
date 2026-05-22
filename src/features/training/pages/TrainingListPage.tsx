"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Plus, Search, ShieldAlert, Award } from "lucide-react";

import {
  useTrainingModules,
  useUpdateTrainingModule,
  useModuleTableColumns,
} from "../hooks";
import { CreateModuleDialog } from "../components";

export function TrainingListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  const isDpoOrAdmin =
    userRoles.includes(UserRole.DPO) ||
    userRoles.includes(UserRole.SUPER_ADMIN) ||
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { modules: allModules, isLoading: isModulesLoading } =
    useTrainingModules();
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

      <CreateModuleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
