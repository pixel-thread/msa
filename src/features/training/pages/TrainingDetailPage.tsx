'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  Users,
  Pencil,
  Trash2,
  Plus,
  Paperclip,
  Award,
  Globe,
  Download,
  Upload,
  X,
} from 'lucide-react';
import {
  useTrainingModule,
  useModuleAssignedUsers,
  useTrainingSupplements,
  useTrainingMemberColumn,
  useTrainingSupplementsColumns,
  useTrainingCompletions,
  useTrainingCompletionsColumns,
  useTrainingCertificates,
  useTrainingCertificatesColumns,
} from '../hooks';
import { Button } from '@src/shared/components/ui/button';
import { Badge } from '@src/shared/components/ui/badge';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@src/shared/components/ui/tabs';
import {
  CompleteAssignmentDialog,
  EditModuleDialog,
  AddSupplementDialog,
  AddCertificateDialog,
  RemoveCertificateAlertDialog,
} from '../components';
import { useUploadCertificateTemplate, useRemoveCertificateTemplate } from '../hooks';
import type { TrainingModuleListItem } from '../types';
import { RemoveSupplementAlertDialog } from '../components/supplements/RemoveSupplementAlertDialog';
import { RemoveModuleAlertDialog } from '../components/RemoveModuleAlertDialog';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { useUrlFilters } from '@hooks/use-url-filters';

export function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();

  const moduleId = (params.moduleId as string) || (params.id as string);

  const { module: trainingModule, isLoading: isModuleLoading } = useTrainingModule(moduleId);
  const { setPage: setSupplementPage, page: supplemetPage } = useUrlFilters({
    pageKey: 'supplement',
    basePath: `/training/${moduleId}`,
  });

  const { setPage: setAssignUserPage, page: assignUserPage } = useUrlFilters({
    pageKey: 'user',
    basePath: `/training/${moduleId}`,
  });

  const {
    assignedUsers,
    isLoading: isAssignedLoading,
    completeAssignment,
    meta: assignedUserMeta,
    isCompleting: isCompletingAssignment,
  } = useModuleAssignedUsers(moduleId, assignUserPage);

  const {
    data: supplements = [],
    meta: supplementMeta,
    isFetching: isSupplementsLoading,
  } = useTrainingSupplements(moduleId, supplemetPage);

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [addSupplementOpen, setAddSupplementOpen] = useState(false);
  const [addCertificateOpen, setAddCertificateOpen] = useState(false);

  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false);

  const { mutate: uploadTemplate, isPending: isUploadingTemplate } =
    useUploadCertificateTemplate(moduleId);
  const { mutate: removeTemplate, isPending: isRemovingTemplate } =
    useRemoveCertificateTemplate(moduleId);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const {
    memberColumns,
    filteredUsers,
    selectedUser,
    completeDialogOpen,
    setCompleteDialogOpen,
    handleComplete,
  } = useTrainingMemberColumn({
    assignedUsers,
    completeAssignment,
  });

  const { supplementColumns, supplementToDelete, setSupplementToDelete } =
    useTrainingSupplementsColumns({
      supplements: supplements || [],
    });

  const { certificates, isLoading: isCertificatesLoading } = useTrainingCertificates(moduleId);

  const { certificateColumns, certificateToDelete, setCertificateToDelete } =
    useTrainingCertificatesColumns({
      certificates: certificates || [],
    });

  const handleDeleteModule = () => {
    setDeleteModuleDialogOpen(true);
  };

  if (isModuleLoading) {
    return <div className="py-24 text-center text-body">Loading training module details...</div>;
  }

  if (!trainingModule) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Module Not Found</h2>
        <p className="text-body mb-6">
          The training module you are trying to access does not exist or has been removed.
        </p>
        <Button onClick={() => router.push('/training')} className="">
          Back to Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto pb-12 w-full h-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{trainingModule.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            v{trainingModule.version} &middot; {trainingModule.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setEditDialogOpen(true)}
            variant="outline"
            className="h-10 border-hairline px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={handleDeleteModule}
            variant="destructive"
            className="h-10 px-4 text-sm font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Training Detail Card */}
      <div className="bg-surface-card border border-hairline p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {trainingModule.description && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Overview
                </h2>
                <p className="text-sm text-body leading-relaxed">{trainingModule.description}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {trainingModule.durationMinutes && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold text-ink">
                    {trainingModule.durationMinutes} mins
                  </span>
                </div>
              )}
              {trainingModule.requiredForRoles.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Required for: </span>
                  <div className="flex flex-wrap gap-1">
                    {trainingModule.requiredForRoles.map((role: string) => (
                      <Badge key={role} variant="secondary" className="text-[10px]">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-hairline">
              <span className="text-muted-foreground">Assigned Users</span>
              <span className="font-semibold text-ink">{assignedUsers.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-hairline">
              <span className="text-muted-foreground">Supplements</span>
              <span className="font-semibold text-ink">{supplements?.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold text-ink">
                {assignedUsers.length > 0
                  ? `${Math.round((assignedUsers.filter((u) => u.status === 'COMPLETED').length / assignedUsers.length) * 100)}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Template Section */}
      <div className="bg-surface-card border border-hairline p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Certificate Template
            </h2>
          </div>
        </div>

        {trainingModule.certificateTemplate?.certificateUrl ? (
          <div className="flex items-center justify-between border border-hairline bg-canvas p-3">
            <div className="flex items-center gap-2 min-w-0">
              <Award className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-body truncate">
                {trainingModule.certificateTemplate.name || 'Template set'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={trainingModule.certificateTemplate.certificateUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTemplate()}
                disabled={isRemovingTemplate}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {templateFile ? (
          <div className="flex items-center justify-between border border-hairline bg-canvas px-3 py-2 mt-2">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-body truncate">{templateFile.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(templateFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isUploadingTemplate}
                onClick={() => {
                  const formData = new FormData();
                  formData.append('file', templateFile);
                  formData.append('name', trainingModule.title + ' Certificate');
                  uploadTemplate(formData, {
                    onSuccess: (res) => {
                      if (res.success) setTemplateFile(null);
                    },
                  });
                }}
                className="h-8 text-xs"
              >
                {isUploadingTemplate ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTemplateFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-hairline bg-canvas px-3 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-2">
            <Upload className="h-4 w-4" />
            {trainingModule.certificateTemplate?.certificateUrl
              ? 'Replace template'
              : 'Upload certificate template'}
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {/* Tabs: Members | Supplements */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Supplements
          </TabsTrigger>
          <TabsTrigger value="completions" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Completions
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {assignedUsers.length} user{assignedUsers.length !== 1 ? 's' : ''} assigned
            </div>
            <Button
              onClick={() => router.push(`/training/${moduleId}/assign`)}
              variant="outline"
              className="h-10 border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Assign Users
            </Button>
          </div>
          <DataTableFilters
            fields={[
              {
                type: 'search',
                id: 'search',
                placeholder: 'Search assigned users...',
              },
            ]}
            onFilterChange={() => {}}
          />
          <DataTable loading={isAssignedLoading} data={filteredUsers} columns={memberColumns} />

          <DataTablePagination meta={assignedUserMeta} onPageChange={setAssignUserPage} />
        </TabsContent>

        <TabsContent value="supplements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {supplements?.length} supplement
              {supplements?.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={() => setAddSupplementOpen(true)}
              variant="outline"
              className="h-10 border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Add Supplement
            </Button>
          </div>
          <DataTable
            loading={isSupplementsLoading}
            data={supplements || []}
            columns={supplementColumns}
          />

          <DataTablePagination meta={supplementMeta} onPageChange={setSupplementPage} />
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Users who completed this module</div>
            <Button
              variant="outline"
              className="h-10 border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
              onClick={() => router.push(`/training/${moduleId}/completions`)}
            >
              <Award className="mr-1.5 h-4 w-4" />
              View All
            </Button>
          </div>
          <CompletionsTabContent moduleId={moduleId} />
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {certificates?.length} certificate
              {certificates?.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={() => setAddCertificateOpen(true)}
              variant="outline"
              className="h-10 border-hairline px-4 text-sm font-semibold flex items-center gap-2 hover:bg-canvas/50"
            >
              <Plus className="h-4 w-4" />
              Add Certificate
            </Button>
          </div>
          <DataTable
            loading={isCertificatesLoading}
            data={certificates || []}
            columns={certificateColumns}
          />
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <CompleteAssignmentDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          userId={selectedUser.userId}
          userName={selectedUser.user.name}
          moduleId={moduleId}
          certificateTemplate={trainingModule?.certificateTemplate}
          onComplete={handleComplete}
          isCompleting={isCompletingAssignment}
        />
      )}

      {trainingModule && (
        <EditModuleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          module={trainingModule as TrainingModuleListItem}
        />
      )}

      <AddSupplementDialog
        open={addSupplementOpen}
        onOpenChange={setAddSupplementOpen}
        moduleId={moduleId}
      />

      <RemoveModuleAlertDialog
        isOpen={deleteModuleDialogOpen}
        onValueChange={(value) => setDeleteModuleDialogOpen(value)}
        moduleId={moduleId || ''}
      />

      <RemoveSupplementAlertDialog
        isOpen={!!supplementToDelete}
        moduleId={supplementToDelete?.id || ''}
        onValueChange={(v) => setSupplementToDelete(!v ? supplementToDelete : null)}
      />

      <AddCertificateDialog
        open={addCertificateOpen}
        onOpenChange={setAddCertificateOpen}
        moduleId={moduleId}
      />

      <RemoveCertificateAlertDialog
        isOpen={!!certificateToDelete}
        moduleId={moduleId}
        certificateId={certificateToDelete?.id || ''}
        onValueChange={(v) => setCertificateToDelete(!v ? certificateToDelete : null)}
      />
    </div>
  );
}

function CompletionsTabContent({ moduleId }: { moduleId: string }) {
  const { completions, isLoading } = useTrainingCompletions(moduleId);
  const { columns } = useTrainingCompletionsColumns();

  return <DataTable loading={isLoading} data={completions} columns={columns} />;
}
