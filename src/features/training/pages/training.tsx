"use client";

import { useState, useMemo } from "react";
import { UserRole } from "@prisma/client";
import { useAuthStore } from "@src/shared/stores/auth";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@src/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/shared/components/ui/tabs";
import { Badge } from "@src/shared/components/ui/badge";
import { Plus, Search, BookOpen, CheckCircle, Clock } from "lucide-react";

import {
  useTrainingModules,
  useAdminCompletions,
  useMyCompletions,
  useModuleTableColumns,
  useCompletionTableColumns,
} from "../hooks";
import {
  CreateModuleDialog,
  EditModuleDialog,
  ManageAssigneesDialog,
  AdminRecordCompletionDialog,
  ViewModuleDialog,
} from "../components";
import type { TrainingModuleListItem } from "../types";

export function TrainingPage() {
  const { user } = useAuthStore();
  const userRoles = user?.role || [];

  // Role Checks
  const isDpoOrAdmin = userRoles.includes(UserRole.DPO) || userRoles.includes(UserRole.SUPER_ADMIN);
  const isSecretaryOrAdmin =
    userRoles.includes(UserRole.SECRETARY) ||
    userRoles.includes(UserRole.PRESIDENT) ||
    userRoles.includes(UserRole.SUPER_ADMIN);
  const isMemberPlus = userRoles.length > 0;

  // Tabs state
  const defaultTab = isMemberPlus ? "my-training" : "my-training";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Search states
  const [memberSearch, setMemberSearch] = useState("");
  const [completionsSearch, setCompletionsSearch] = useState("");
  const [modulesSearch, setModulesSearch] = useState("");

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModuleListItem | null>(null);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

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

  const {
    completions: myCompletions,
    isLoading: isMyCompletionsLoading,
  } = useMyCompletions();

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

  // Filter lists based on search
  const filteredMyModules = useMemo(() => {
    // Current user's modules (Active modules)
    const activeMods = allModules.filter((m) => m.isActive);
    const query = memberSearch.toLowerCase().trim();
    if (!query) return activeMods;
    return activeMods.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [allModules, memberSearch]);

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

  // Map module completion status for current user
  const completedModuleIds = useMemo(() => {
    return new Set(myCompletions.map((c) => c.moduleId));
  }, [myCompletions]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Training Portal
          </h1>
          <p className="mt-1 text-base text-body">
            Access training courses, check completions, and manage modules.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-canvas/50 border p-1 rounded-xl">
          {isMemberPlus && (
            <TabsTrigger value="my-training" className="px-5 py-2 text-sm">
              My Training
            </TabsTrigger>
          )}
          {isSecretaryOrAdmin && (
            <TabsTrigger value="completions" className="px-5 py-2 text-sm">
              Completions (Admin)
            </TabsTrigger>
          )}
          {isDpoOrAdmin && (
            <TabsTrigger value="modules" className="px-5 py-2 text-sm">
              Modules (Admin)
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Training Tab */}
        {isMemberPlus && (
          <TabsContent value="my-training" className="space-y-6 outline-none">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search my training..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
                />
              </div>
            </div>

            {isMyCompletionsLoading || isModulesLoading ? (
              <div className="py-12 text-center text-body text-sm">
                Loading training modules...
              </div>
            ) : filteredMyModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-surface-card border rounded-xl">
                <BookOpen className="h-10 w-10 text-muted mb-3" />
                <p className="text-sm text-muted">No training modules available right now.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyModules.map((module) => {
                  const isCompleted = completedModuleIds.has(module.id);
                  return (
                    <Card
                      key={module.id}
                      onClick={() => {
                        setSelectedModule(module);
                        setViewOpen(true);
                      }}
                      className="cursor-pointer border-hairline bg-surface-card transition-all hover:bg-canvas/40 hover:shadow-sm"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-md font-semibold text-ink line-clamp-1">
                            {module.title}
                          </CardTitle>
                          {isCompleted ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shrink-0">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        {module.description && (
                          <CardDescription className="line-clamp-2 text-xs pt-1">
                            {module.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted">
                          {module.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {module.durationMinutes} mins
                            </span>
                          )}
                          <span className="text-[10px]">v{module.version}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}

        {/* Completions Tab (Admin) */}
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

        {/* Modules Tab (Admin) */}
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

      <ViewModuleDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        module={selectedModule}
        isCompleted={selectedModule ? completedModuleIds.has(selectedModule.id) : false}
      />
    </>
  );
}
