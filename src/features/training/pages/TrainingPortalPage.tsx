"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { Input } from "@src/shared/components/ui/input";
import { Button } from "@src/shared/components/ui/button";
import { Search, BookOpen, ShieldAlert } from "lucide-react";
import { DataTable } from "@src/shared/components/data-table";

import {
  useTrainingModules,
  useMyCompletions,
  usePortalModuleTableColumns,
} from "../hooks";

export function TrainingPortalPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  // Admins can see the admin portal link
  const isAdminUser = userRoles.some((role) =>
    (
      [
        UserRole.DPO,
        UserRole.SECRETARY,
        UserRole.PRESIDENT,
        UserRole.SUPER_ADMIN,
      ] as UserRole[]
    ).includes(role),
  );

  const adminUrl = useMemo(() => {
    const isDpoOrAdmin = userRoles.some((role) =>
      ([UserRole.DPO, UserRole.SUPER_ADMIN] as UserRole[]).includes(role),
    );
    return isDpoOrAdmin ? "/training/modules" : "/training/completions";
  }, [userRoles]);

  const [search, setSearch] = useState("");

  const { modules, isLoading: isModulesLoading } = useTrainingModules();
  const { completions: myCompletions, isLoading: isCompletionsLoading } =
    useMyCompletions();

  // Filter modules that are active (assigned/available to members)
  const filteredModules = useMemo(() => {
    const activeMods = modules.filter((m) => m.isActive);
    const query = search.toLowerCase().trim();
    if (!query) return activeMods;
    return activeMods.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query),
    );
  }, [modules, search]);

  const completedModuleIds = useMemo(() => {
    return new Set(myCompletions.map((c: any) => c.moduleId));
  }, [myCompletions]);

  const { columns } = usePortalModuleTableColumns({
    completedModuleIds,
    onView: (module) => {
      router.push(`/training/modules/${module.id}`);
    },
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            My Training
          </h1>
          <p className="mt-1 text-base text-body">
            View and complete your assigned training courses.
          </p>
        </div>

        {isAdminUser && (
          <Button
            onClick={() => router.push(adminUrl)}
            variant="outline"
            className="h-11 rounded-full border-hairline px-5 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
          >
            <ShieldAlert className="h-4 w-4 text-primary" />
            Admin Dashboard
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search training modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
          />
        </div>
      </div>

      <DataTable
        loading={isModulesLoading || isCompletionsLoading}
        data={filteredModules}
        columns={columns}
      />
    </>
  );
}
