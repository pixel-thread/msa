"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/shared/components/ui/tabs";
import { Plus, Search, ShieldAlert, ArrowLeft } from "lucide-react";

import {
  useTrainingModules,
  useAdminCompletions,
  useModuleTableColumns,
  useCompletionTableColumns,
} from "../hooks";
import {
  CreateModuleDialog,
  EditModuleDialog,
  ManageAssigneesDialog,
  AdminRecordCompletionDialog,
} from "../components";
import type { TrainingModuleListItem } from "../types";

export function TrainingAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  // Role Checks
  const isDpoOrAdmin = userRoles.includes(UserRole.DPO) || userRoles.includes(UserRole.SUPER_ADMIN);
  const isSecretaryOrAdmin =
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT) ||
    userRoles.includes(UserRole.SUPER_ADMIN);

  // If user does not have permission, show Access Denied
  const hasAccess = isDpoOrAdmin || isSecretaryOrAdmin;

  // Tabs state
  const defaultTab = isSecretaryOrAdmin ? "completions" : "modules";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Search states
  const [completionsSearch, setCompletionsSearch] = useState("");
  const [modulesSearch, setModulesSearch] = useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModuleListItem | null>(null);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  // Hook invocations
  const {
    modules: allModules,
    isLoading: isModulesLoading,
    updateModule,
  } = useTrainingModules();

  const {
    completions: allCompletions,
    isLoading: isCompletionsLoading,
  } = useAdminCompletions();

  // Columns
  const { columns: moduleColumns } = useModuleTableColumns({
    onEdit: (mod) => {
      setSelectedModule(mod);
      setEditOpen(true);
    },
    onManageAssignees: (mod) => {
      setSelectedModule(mod);
      setAssigneesOpen(true);
    },
    onToggleActive: (mod) => {
      updateModule({
        moduleId: mod.id,
        data: { isActive: !mod.isActive },
      });
    },
  });

  const { columns: completionColumns } = useCompletionTableColumns();

  const filteredCompletions = useMemo(() => {
    const query = completionsSearch.toLowerCase().trim();
    if (!query) return allCompletions;
    return allCompletions.filter(
      (c) =>
        c.user?.name?.toLowerCase().includes(query) ||
        c.user?.email?.toLowerCase().includes(query) ||
        c.module?.title?.toLowerCase().includes(query)
    );
  }, [allCompletions, completionsSearch]);

  const filteredModules = useMemo(() => {
    const query = modulesSearch.toLowerCase().trim();
    if (!query) return allModules;
    return allModules.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [allModules, modulesSearch]);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-ink mb-2">Access Denied</h2>
        <p className="text-body max-w-md mb-8">
          You do not have the required permissions to view the training administration dashboard.
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
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink flex items-center gap-2">
            Training Administration
          </h1>
          <p className="mt-1 text-base text-body">
            Manage training modules, assign users, and record completion history.
          </p>
        </div>

        <Button
          onClick={() => router.push("/training")}
          variant="outline"
          className="h-11 rounded-full border-hairline px-5 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Portal Home
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-canvas/50 border p-1 rounded-xl">
          {isSecretaryOrAdmin && (
            <TabsTrigger value="completions" className="px-5 py-2 text-sm">
              Completions
            </TabsTrigger>
          )}
          {isDpoOrAdmin && (
            <TabsTrigger value="modules" className="px-5 py-2 text-sm">
              Modules
            </TabsTrigger>
          )}
        </TabsList>

        {/* Completions Tab */}
        {isSecretaryOrAdmin && (
          <TabsContent value="completions" className="space-y-6 outline-none">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search completion records..."
                  value={completionsSearch}
                  onChange={(e) => setCompletionsSearch(e.target.value)}
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
          </TabsContent>
        )}

        {/* Modules Tab */}
        {isDpoOrAdmin && (
          <TabsContent value="modules" className="space-y-6 outline-none">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search training modules..."
                  value={modulesSearch}
                  onChange={(e) => setModulesSearch(e.target.value)}
                  className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
                />
              </div>

              <Button
                onClick={() => setCreateOpen(true)}
                className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </div>

            <DataTable
              loading={isModulesLoading}
              data={filteredModules}
              columns={moduleColumns}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Components */}
      <CreateModuleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditModuleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        module={selectedModule}
      />

      <ManageAssigneesDialog
        open={assigneesOpen}
        onOpenChange={setAssigneesOpen}
        module={selectedModule}
      />

      <AdminRecordCompletionDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </>
  );
}
